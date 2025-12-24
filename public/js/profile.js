$(document).ready(function () {
    $("#profileForm").on("submit", async function (e) {
        e.preventDefault();

        const btn = $(this).find('button[type="submit"]');
        const originalText = btn.html();

        // Form Data
        const formData = {
            name: $(this).find('[name="name"]').val(),
            surname: $(this).find('[name="surname"]').val(),
            email: $(this).find('[name="email"]').val(),
            gender: $(this).find('[name="gender"]').val(),
            password: $(this).find('[name="password"]').val(),
            passwordConfirm: $(this).find('[name="passwordConfirm"]').val()
        };

        // Password Validation
        if (formData.password || formData.passwordConfirm) {
            if (formData.password !== formData.passwordConfirm) {
                alert("The passwords you entered do not match!");
                return;
            }
            if (formData.password.length < 6) {
                alert("The password must be at least 6 characters long.");
                return;
            }
        }

        // Loading
        btn
            .prop("disabled", true)
            .html('<span class="spinner-border spinner-border-sm me-2"></span>Saving...');

        try {
            const res = await $.ajax({
                url: "/profile/update",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(formData)
            });

            if (res.success) {
                alert("Your information has been updated successfully.");
                // Reload the page to refresh cookies and UI
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert(err.responseJSON?.error || "An error occurred while updating your information.");
            btn.prop("disabled", false).html(originalText);
        }
    });
});