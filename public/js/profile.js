$(document).ready(function () {
    $("#profileForm").on("submit", async function (e) {
        e.preventDefault();

        const btn = $(this).find('button[type="submit"]');
        const originalText = btn.html();

        // Form Verileri
        const formData = {
            name: $(this).find('[name="name"]').val(),
            surname: $(this).find('[name="surname"]').val(),
            email: $(this).find('[name="email"]').val(),
            gender: $(this).find('[name="gender"]').val(),
            password: $(this).find('[name="password"]').val(),
            passwordConfirm: $(this).find('[name="passwordConfirm"]').val()
        };

        // Şifre Kontrolü
        if (formData.password || formData.passwordConfirm) {
            if (formData.password !== formData.passwordConfirm) {
                alert("Girdiğiniz şifreler eşleşmiyor!");
                return;
            }
            if (formData.password.length < 6) {
                alert("Şifre en az 6 karakter olmalıdır.");
                return;
            }
        }

        // Loading
        btn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm me-2"></span>Kaydediliyor...');

        try {
            const res = await $.ajax({
                url: "/profile/update",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(formData)
            });

            if (res.success) {
                alert("Bilgileriniz başarıyla güncellendi.");
                // Sayfayı yenile ki cookie ve UI güncellensin
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert(err.responseJSON?.error || "Güncelleme sırasında bir hata oluştu.");
            btn.prop("disabled", false).html(originalText);
        }
    });
});