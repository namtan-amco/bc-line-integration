// async function GetUserProfile() {
//     try {
//         // Initialize LIFF SDK
//         await liff.init({ liffId: myLiffId });


//         // เช็กสถานะการล็อกอินและแสดงข้อมูลโปรไฟล์
//         if (!liff.isLoggedIn()) {
//             liff.login(); // บังคับล็อกอินถ้ายังไม่ได้เข้าระบบ
//         } else {
//             const profile = await liff.getProfile();
            
//             // ซ่อนข้อความโหลด และแสดงโซนโปรไฟล์
//             document.getElementById('loading').style.display = 'none';
//             document.getElementById('profile-zone').style.display = 'block';
            
//             // นำข้อมูลมาใส่ใน HTML
//             document.getElementById('user-picture').src = profile.pictureUrl;
//             document.getElementById('user-name').innerText = profile.displayName;
//             document.getElementById('user-id').innerText = profile.userId;
//         }
//     } catch (err) {
//         console.error('ระบบ LIFF ทำงานผิดพลาด:', err);
//         document.getElementById('loading').innerText = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE';
//     }
// }