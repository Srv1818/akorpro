const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Firebase yetkilerimizi başlatıyoruz
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// BURAYA KENDİ UID KODUNU YAPIŞTIR (Tırnak işaretlerini silmeden!)
const uid = "DytMLEhjBXNNZPsu2tbo7s6BKKI3";

// Hesabına admin yetkisini veriyoruz
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`🎉 Başarılı! ${uid} ID'li kullanıcı artık bir ADMIN.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Hata oluştu:", error);
    process.exit(1);
  });