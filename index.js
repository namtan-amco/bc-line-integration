
const myLiffId = "2010128261-kYvBcg1E";

const body = document.querySelector("#body");

// ตัวแปรเก็บค่าสำคัญที่ดักมาจากลิงก์แชท LINE
let currentApprovalEntrySystemId = "";
let currentDocumentNo = "";

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

        // แกะค่าจาก URL (ที่ส่งมาจาก Power Automate ในอนาคต)
        // ตัวอย่างลิงก์: https://liff.line.me/xxx?documentNo=SQ-26001&systemId=guid-xxxx
        const urlParams = new URLSearchParams(window.location.search);
        currentDocumentNo = urlParams.get('documentNo') || "SQ-26001"; // Mockup data
        currentApprovalEntrySystemId = urlParams.get('systemId') || "mock-system-id";

        // สั่งให้แสดงข้อมูลการอนุมัติ (ตอนนี้ใช้ข้อมูลจำลองก่อน)
        loadMockData(currentDocumentNo);

    } catch (err) {
        console.error('LIFF Init Error:', err);
        document.getElementById('loading-status').innerText = "เกิดข้อผิดพลาดในการโหลดระบบ LINE Mini App";
    }
}

// Function to load mock data for demonstration purposes
function loadMockData(docNo) {
    // แสดงข้อมูล Header
    document.getElementById('doc-no').innerText = docNo;
    document.getElementById('cust-name').innerText = "บริษัท อาม่า คอร์ปอเรชัน จำกัด";
    document.getElementById('doc-date').innerText = "19/05/2026";
    document.getElementById('doc-amount').innerText = "35,500.00 THB";

    // จำลองข้อมูลรายการสินค้า (Sales Lines)
    const mockSalesLines = [
        { itemNo: "1000", desc: "Bicycle (จักรยานเสือภูเขา)", qty: 2, uom: "PCS", price: 15000, amount: 30000 },
        { itemNo: "1120", desc: "Front Wheel (ล้อจักรยานด้านหน้า)", qty: 2, uom: "PCS", price: 2500, amount: 5000 },
        { itemNo: "GL-05", desc: "Shipping Fee (ค่าจัดส่งสินค้า)", qty: 1, uom: "BOX", price: 500, amount: 500 }
    ];

    // นำรายการสินค้าไปพ่นลงใน HTML
    const linesContainer = document.getElementById('sales-lines-list');
    linesContainer.innerHTML = ""; // ล้างค่าเก่า

    mockSalesLines.forEach(line => {
        const lineHtml = `
            <div class="p-4 flex justify-between items-start text-sm">
                <div class="space-y-1">
                    <p class="font-bold text-slate-800">${line.desc}</p>
                    <p class="text-xs text-slate-400">รหัส: ${line.itemNo} | จำนวน: ${line.qty} ${line.uom} x ฿${line.price.toLocaleString()}</p>
                </div>
                <div class="text-right font-semibold text-slate-700">
                    ฿${line.amount.toLocaleString()}
                </div>
            </div>
        `;
        linesContainer.insertAdjacentHTML('beforeend', lineHtml);
    });

    // สลับหน้ากาก: ซ่อนคำว่า Loading แล้วเปิดแสดงเนื้อหาจริง
    document.getElementById('loading-status').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
}

// Function to handle Approve/Reject button clicks
function handleAction(actionType) {
    const commentValue = document.getElementById('approve-comment').value;

    // คอนเฟิร์มกับผู้ใช้งานอีกครั้งเพื่อป้องกันการกดพลาด
    const confirmText = actionType === 'APPROVE' ? 'ยืนยันการ "อนุมัติ" ใช่หรือไม่?' : 'ยืนยันการ "ปฏิเสธ" ใช่หรือไม่?';
    if (!confirm(confirmText)) return;

    alert(`[ทดสอบระบบ] คุณกดปุ่ม: ${actionType}\nความคิดเห็น: ${commentValue || "-"}\nID อ้างอิง: ${currentApprovalEntrySystemId}`);
    
    // เขียนโค้ดตรงนี้ให้ยิงข้อมูลเข้า Power Automate จริงๆ
}

main();