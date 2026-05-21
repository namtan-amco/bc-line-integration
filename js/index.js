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

        // Check if the user is logged in, if not, trigger the login process
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        // Get user profile information
        const profile = await liff.getProfile();
        document.getElementById('user-name').innerText = profile.displayName;
        document.getElementById('user-picture').src = profile.pictureUrl;

        // Get query parameters from the URL (passed from the LINE chat link)
        const urlParams = new URLSearchParams(window.location.search);
        currentDocumentNo = urlParams.get('documentNo');
        currentCustomerName = urlParams.get('customerName') || "ไม่พบชื่อลูกค้า";
        currentApprovalEntrySystemId = urlParams.get('systemId');
        currentAmount = urlParams.get('amount') || "0.00";
        currentDocDate = urlParams.get('docDate') || "-";

        if (!currentDocumentNo || !currentApprovalEntrySystemId) {
            document.getElementById('loading-status').innerHTML = "❌ ไม่พบข้อมูลเอกสาร <br><span class='text-xs text-red-400'>กรุณาเปิดลิงก์นี้จากห้องแชทแจ้งเตือนของ LINE</span>";
            return;
        }
        // Call function to load data from Power Automate and display it on the page
        await loadData(currentDocumentNo, currentCustomerName, currentAmount, currentDocDate);

    } catch (err) {
        console.error('LIFF Init Error:', err);
        document.getElementById('loading-status').innerText = "เกิดข้อผิดพลาดในการโหลดระบบ LINE Mini App";
    }
}

// Function to load data from Power Automate and display it on the page
async function loadData(docNo, customerName, amount, docDate) {

    try {
        const response = await fetch(urlFetchSalesLines, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentNo: docNo,
                documentType: "Quote"
            })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        // Send the actual sales lines data from Power Automate to the frontend and display it
        const salesLines = await response.json(); 

        document.getElementById('doc-no').innerText = docNo;
        document.getElementById('cust-name').innerText = customerName;
        document.getElementById('doc-date').innerText = docDate;
        document.getElementById('doc-amount').innerText = amount + " THB";

        const linesContainer = document.getElementById('sales-lines-list');
        linesContainer.innerHTML = "";

        if (salesLines && salesLines.length > 0) {
            salesLines.forEach(line => {
                const lineAmount = Number(line.LineAmount) || 0;

                const lineHtml = `
                    <div class="p-4 flex justify-between items-start text-sm border-b border-slate-100">
                        <div class="space-y-1">
                            <p class="font-bold text-slate-800">${line.Description || 'ไม่มีรายละเอียด'}</p>
                            <p class="text-xs text-slate-400">รหัส: ${line.No || '-'} | จำนวน: ${line.Quantity || 0} ${line.UnitOfMeasure || ''} x ฿${(Number(line.UnitPrice) || 0).toLocaleString()}</p>
                        </div>
                        <div class="text-right font-semibold text-slate-700">
                            ฿${lineAmount.toLocaleString()}
                        </div>
                    </div>
                `;
                linesContainer.insertAdjacentHTML('beforeend', lineHtml);
            });
        } else {
            linesContainer.innerHTML = "<p class='p-4 text-center text-sm text-slate-400'>ไม่พบรายการสินค้าในเอกสารใบนี้</p>";
        }

        // Hide loading status and show main content
        document.getElementById('loading-status').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error fetching sales lines:', error);
        document.getElementById('loading-status').innerText = "❌ ไม่สามารถดึงข้อมูลสินค้าจาก Business Central ได้";
    }
}

// Function to handle Approve/Reject button clicks
async function handleAction(actionType) {
    const commentValue = document.getElementById('approve-comment').value;

    // Show a confirmation dialog before proceeding with the action
    const confirmText = actionType === 'APPROVE' ? 'ยืนยันการ "อนุมัติ" ใช่หรือไม่?' : 'ยืนยันการ "ปฏิเสธ" ใช่หรือไม่?';
    if (!confirm(confirmText)) return;

    // Disable buttons and show loading state while processing the approval/rejection
    document.getElementById('btn-approve').disabled = true;
    document.getElementById('btn-reject').disabled = true;
    document.getElementById('btn-approve').innerText = "กำลังบันทึก...";

    try {
        // Submit the approval decision to Power Automate
        const response = await fetch(urlSubmitApproval, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemId: currentApprovalEntrySystemId,
                action: actionType,
                comment: commentValue
            })
        });

        if (response.ok) {
            alert(`ดำเนินการเสร็จสิ้น: ระบบทำการ ${actionType === 'APPROVE' ? 'อนุมัติ' : 'ปฏิเสธ'} เรียบร้อยแล้ว`);
            liff.closeWindow(); // Close the Line mini app after successful submission
        } else {
            alert(`เกิดข้อผิดพลาด (Status: ${response.status} - ${response.statusText}) ไม่สามารถบันทึกสถานะได้`);
            document.getElementById('btn-approve').disabled = false;
            document.getElementById('btn-reject').disabled = false;
            document.getElementById('btn-approve').innerText = "อนุมัติ (Approve)";
        }

    } catch (error) {
        console.error('Submit Error:', error);
        alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
        document.getElementById('btn-approve').disabled = false;
        document.getElementById('btn-reject').disabled = false;
        document.getElementById('btn-approve').innerText = "อนุมัติ (Approve)";
    }
}

main();