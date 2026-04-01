document.getElementById("confirmTicket").addEventListener("click", async (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini (geleneksel POST'u) engelliyoruz!

    const form = document.getElementById("ticketSubmit");
    const formData = new FormData(form);

    const payload = Object.fromEntries(formData);

    payload.seatNumbers = formData.getAll("seatNumbers[]");
    payload.genders = formData.getAll("genders[]");

    // Pug dosyasındaki input isimlerini çekip JSON array'e koyuyoruz
    payload.names = formData.getAll("name[]");
    payload.surnames = formData.getAll("surname[]");
    payload.idNumbers = formData.getAll("idNumber[]");

    payload.phone = formData.get("phone");
    payload.email = formData.get("email");

    const btn = document.getElementById("confirmTicket");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>İşleniyor...';

    try {
        const res = await fetch(`/payment/${payload.paymentId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            alert("Bilet başarıyla kesildi! PNR Kodunuz: " + data.pnr);
            window.location.href = "/"; // Şimdilik anasayfaya dönsün
        } else {
            alert("❌ İşlem başarısız: " + (data.error || "Bilinmeyen hata"));
        }
    } catch (err) {
        alert("❌ Sistemsel bir hata oluştu.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});