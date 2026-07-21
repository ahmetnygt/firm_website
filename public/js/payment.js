document.getElementById("confirmTicket").addEventListener("click", async (e) => {
    e.preventDefault();

    const form = document.getElementById("ticketSubmit");
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData);

    payload.seatNumbers = formData.getAll("seatNumbers[]");
    payload.genders = formData.getAll("genders[]");
    payload.names = formData.getAll("name[]");
    payload.surnames = formData.getAll("surname[]");
    payload.idNumbers = formData.getAll("idNumber[]");
    payload.phone = formData.get("phone");
    payload.email = formData.get("email");
    payload.asReservation = true;

    const btn = document.getElementById("confirmTicket");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Rezervasyon yapılıyor...';

    try {
        const res = await fetch(`/payment/${payload.paymentId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            const phone = data.phone || window.__reservationPhone || "";
            const phoneHint = phone
                ? `\n\nLütfen teyit için ${phone} numarasını arayın.`
                : "\n\nLütfen teyit için firmayı arayın.";
            alert(
                "Rezervasyonunuz oluşturuldu.\nPNR Kodunuz: " + data.pnr +
                phoneHint +
                "\n\nBu bir satış değildir; arayıp teyit etmeniz gerekir."
            );
            window.location.href = "/";
        } else {
            alert("İşlem başarısız: " + (data.error || "Bilinmeyen hata"));
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (err) {
        alert("Sistemsel bir hata oluştu.");
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});
