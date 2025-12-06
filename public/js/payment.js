document.getElementById("confirmTicket").addEventListener("click", async () => {
    const form = document.getElementById("ticketSubmit");
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData);

    // Çoklu yolcu
    payload.seatNumbers = formData.getAll("seatNumbers[]");
    payload.genders = formData.getAll("genders[]");
    payload.names = formData.getAll("name[]");
    payload.surnames = formData.getAll("surname[]");
    payload.idNumbers = formData.getAll("idNumber[]");

    const res = await fetch(`/api/ticket/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success)
        return window.location.href = `/ticket/${data.ticketGroupId}`;

    alert("❌ Bilet oluşturulamadı!");
});
