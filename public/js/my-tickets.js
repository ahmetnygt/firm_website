$(document).ready(function () {
    $(".cancel-btn").on("click", async function (e) {
        e.preventDefault();

        const id = $(this).data("id");
        const action = $(this).data("action"); // 'cancel' veya 'refund'
        const actionText = action === 'refund' ? "iade etmek" : "iptal etmek";

        if (!confirm(`Bu bileti ${actionText} istediğinize emin misiniz?`)) return;

        try {
            const res = await $.ajax({
                url: "/ticket/cancel",
                type: "POST",
                data: { ticketId: id, action: action }
            });

            if (res.success) {
                alert("İşlem başarıyla gerçekleştirildi.");
                window.location.reload();
            }
        } catch (err) {
            alert("İşlem sırasında bir hata oluştu.");
        }
    });
});