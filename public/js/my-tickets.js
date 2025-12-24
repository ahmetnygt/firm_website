$(document).ready(function () {
    $(".cancel-btn").on("click", async function (e) {
        e.preventDefault();

        const id = $(this).data("id");
        const action = $(this).data("action"); // 'cancel' or 'refund'
        const actionText = action === "refund" ? "refund" : "cancel";

        if (!confirm(`Are you sure you want to ${actionText} this ticket?`)) return;

        try {
            const res = await $.ajax({
                url: "/ticket/cancel",
                type: "POST",
                data: { ticketId: id, action: action }
            });

            if (res.success) {
                alert("The operation was completed successfully.");
                window.location.reload();
            }
        } catch (err) {
            alert("An error occurred during the operation.");
        }
    });
});