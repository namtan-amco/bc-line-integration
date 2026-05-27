const myLiffId = "2010128261-kYvBcg1E";
const urlFetchSalesLines = "https://default62c465b8d4a74552b7e2ab054bb358.6d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7765aba9cc08433fad8382175f70e03e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wAQfzYs9QURYawYqJGCXw1C3nRmP1RRxk6OrWQ2dTOY";
const urlSubmitApproval = "https://default62c465b8d4a74552b7e2ab054bb358.6d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/15c4c982bb9143aca0bf8735cd307965/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jpVZcxz_6RHycwfw_2HzC49UCYRZiIBtsfiFonKpw1g";

let currentApprovalEntrySystemId = "";
let currentDocumentNo = "";
let currentCustomerName = "";
let currentAmount = "";
let currentDocDate = "";

// Function to initialize Line mini app and load data when the page is ready
async function main() {
    try {
        await liff.init({ liffId: myLiffId });

        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        const profile = await liff.getProfile();
        document.getElementById('user-name').innerText = profile.displayName;
        document.getElementById('user-picture').src = profile.pictureUrl;

        // รับค่า Generic Parameter จาก URL
        const urlParams = new URLSearchParams(window.location.search);
        currentDocumentNo = urlParams.get('documentNo') || "-";
        currentRecordDetails = urlParams.get('recordDetails') || "ไม่มีรายละเอียด";
        currentApprovalEntrySystemId = urlParams.get('systemId');
        currentAmount = urlParams.get('amount') || "0.00";
        currentTableId = urlParams.get('tableId');

        if (!currentApprovalEntrySystemId) {
            document.getElementById('loading-status').innerHTML = "❌ ไม่พบข้อมูลอ้างอิงของเอกสาร <br><span class='text-xs text-red-400'>กรุณาเปิดลิงก์นี้จากห้องแชทแจ้งเตือนของ LINE</span>";
            return;
        }
        
        await loadData(currentDocumentNo, currentRecordDetails, currentAmount);

    } catch (err) {
        console.error('LIFF Init Error:', err);
        document.getElementById('loading-status').innerText = "เกิดข้อผิดพลาดในการโหลดระบบ LINE Mini App";
    }
}

// Function loadData
async function loadData(docNo, recordDetails, amount) {
    try {
        const response = await fetch(urlFetchSalesLines, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemId: currentApprovalEntrySystemId // ส่งแค่ systemId ไปก็พอแล้ว
            })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const responseData = await response.json(); 
        const approvalStatus = responseData.status ? String(responseData.status).toUpperCase() : "OPEN";
        
        // รับค่า lines แทน salesLines
        // เนื่องจากฟังก์ชัน GetLines() คืนค่ากลับมาเป็น String เราจึงต้อง parse มันให้เป็น JSON Array
        let workflowLines = [];
        if (responseData.lines) {
            try {
                workflowLines = typeof responseData.lines === 'string' ? JSON.parse(responseData.lines) : responseData.lines;
            } catch(e) { console.error('Parse lines error:', e); }
        }

        document.getElementById('doc-no').innerText = docNo;
        document.getElementById('record-details').innerText = recordDetails;
        document.getElementById('doc-amount').innerText = amount + " THB";

        const actionContainer = document.getElementById('action-buttons-container');
        const commentBox = document.getElementById('approve-comment');

        if (approvalStatus !== "OPEN") {
            var statusMessage = "เอกสารนี้ได้รับการประมวลผลแล้ว";
            if (approvalStatus === 'APPROVED') statusMessage = "เอกสารนี้ถูกอนุมัติเรียบร้อยแล้ว";
            if (approvalStatus === 'REJECTED') statusMessage = "เอกสารนี้ถูกปฏิเสธแล้ว";
            if (approvalStatus === 'CANCELED') statusMessage = "เอกสารนี้ถูกยกเลิกแล้ว";

            if (commentBox) commentBox.disabled = true;
            document.getElementById('btn-approve').style.display = 'none';
            document.getElementById('btn-reject').style.display = 'none';

            const banner = document.getElementById('status-banner');
            if (banner) {
                banner.innerText = statusMessage;
                banner.classList.remove('hidden');
            } else if (actionContainer) {
                actionContainer.innerHTML = `<p class="text-center font-bold text-slate-700 py-4">${statusMessage}</p>`;
            }
        }

        const linesContainer = document.getElementById('lines-list');
        linesContainer.innerHTML = "";

        if (workflowLines && workflowLines.length > 0) {
            workflowLines.forEach(line => {
                const lineAmount = Number(line.lineAmount) || 0;
                // ปรับ Property ชื่อให้ตรงกับ JSON กลางที่เราสร้างใน AL (พิมพ์เล็ก)
                const lineHtml = `
                    <div class="p-4 flex justify-between items-start text-sm border-b border-slate-100">
                        <div class="space-y-1">
                            <p class="font-bold text-slate-800">${line.description || 'ไม่มีรายละเอียด'}</p>
                            <p class="text-xs text-slate-400">รหัส: ${line.no || '-'} | จำนวน: ${line.quantity || 0} x ฿${(Number(line.unitPrice) || 0).toLocaleString()}</p>
                        </div>
                        <div class="text-right font-semibold text-slate-700">
                            ฿${lineAmount.toLocaleString()}
                        </div>
                    </div>
                `;
                linesContainer.insertAdjacentHTML('beforeend', lineHtml);
            });
        } else {
            // กรณีไม่มี Line (เช่น Item Journal) หรือไม่พบข้อมูล
            linesContainer.innerHTML = "<p class='p-4 text-center text-sm text-slate-400'>ไม่มีรายละเอียดไอเทมในเอกสารนี้</p>";
        }

        document.getElementById('loading-status').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error fetching lines:', error);
        document.getElementById('loading-status').innerText = "❌ ไม่สามารถดึงข้อมูลเอกสารจาก Business Central ได้";
    }
}

// Function to handle Approve/Reject button clicks
async function handleAction(actionType) {
    const commentValue = document.getElementById('approve-comment').value;

    let userIdText = "Unknown";
    try {
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            userIdText = profile.userId;
        }
    } catch (profileErr) {
        console.error('Error getting profile in handleAction:', profileErr);
    }

    // Show a confirmation dialog before proceeding with the action
    const confirmText = actionType === 'APPROVE' ? 'ยืนยันการ "อนุมัติ" ใช่หรือไม่?' : 'ยืนยันการ "ปฏิเสธ" ใช่หรือไม่?';
    if (!confirm(confirmText)) return;

    // Disable buttons and show loading state while processing the approval/rejection
    document.getElementById('btn-approve').disabled = true;
    document.getElementById('btn-reject').disabled = true;
    document.getElementById('btn-approve').innerText = "กำลังบันทึก...";
    document.getElementById('btn-reject').innerText = "กำลังบันทึก...";

    try {
        // Submit the approval decision to Power Automate
        const response = await fetch(urlSubmitApproval, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemId: currentApprovalEntrySystemId,
                action: actionType,
                comment: commentValue || "",
                approverLineUserId: userIdText
            })
        });

        if (response.ok) {
            alert(`ดำเนินการเสร็จสิ้น: ระบบทำการ ${actionType === 'APPROVE' ? 'อนุมัติ' : 'ปฏิเสธ'} เรียบร้อยแล้ว`);
            liff.closeWindow(); // Close the Line mini app after successful submission
        } else {
            alert(`เกิดข้อผิดพลาด (Status: ${response.status} - ${response.statusText}) ไม่สามารถบันทึกสถานะได้`);
            document.getElementById('btn-approve').disabled = false;
            document.getElementById('btn-reject').disabled = false;
            document.getElementById('btn-approve').innerText = "Approve";
            document.getElementById('btn-reject').innerText = "Reject";
        }

    } catch (error) {
        console.error('Submit Error:', error);
        alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
        document.getElementById('btn-approve').disabled = false;
        document.getElementById('btn-reject').disabled = false;
        document.getElementById('btn-approve').innerText = "Approve";
        document.getElementById('btn-reject').innerText = "Reject";
    }
}

main();