document.getElementById("confirmTicket").addEventListener("click", async () => {
    const form = document.getElementById("ticketSubmit");
    const formData = new FormData(form);

    // Temel verileri al (paymentId, phone, email vb. burada gelir)
    const payload = Object.fromEntries(formData);

    // Array olan verileri elle ekle (çünkü fromEntries sadece sonuncuyu alır)
    payload.seatNumbers = formData.getAll("seatNumbers[]");
    payload.genders = formData.getAll("genders[]");

    // Pug dosyasında name="name[]" olduğu için buradan "name[]" olarak çekiyoruz
    payload.names = formData.getAll("name[]");
    payload.surnames = formData.getAll("surname[]");
    payload.idNumbers = formData.getAll("idNumber[]");

    // İletişim bilgilerini garantiye al (Pug'daki name="phone" ve name="email")
    payload.phone = formData.get("phone");
    payload.email = formData.get("email");

    // EĞER URL "/api/ticket/complete" KALIRSA HATA ALIRSIN.
    // Backend'de route: router.post("/payment/:id", siteController.paymentComplete);
    // Bu yüzden isteği aşağıdaki gibi dinamik ID'li adrese atmalısın:

    const res = await fetch(`/payment/${payload.paymentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
        // Başarılıysa success sayfasına veya bilet detayına git
        // Backend'den ticketGroupId dönüyorsan: `/ticket-success/${data.ticketGroupId}` gibi bir şey de yapabilirsin.
        window.location.href = "/success";
    } else {
        alert("❌ İşlem başarısız: " + (data.error || "Bilinmeyen hata"));
    }
});