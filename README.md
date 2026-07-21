# Firm Website Template

Tek firma online bilet sitesi şablonu. Gotur VIP (goturyzhn) partner API'sine bağlanır. Her firma için bu repo'yu kopyalayıp `config/site.json` + görseller + `.env` güncelleyerek ayrı publish edersiniz.

## Hızlı başlangıç

```bash
cp .env.example .env
# .env içine GOTUR_* ve SITE_URL yazın

npm install
npm run dev          # geliştirme (nodemon)
# veya
npm start            # production
```

Site: `http://localhost:5000`

## Yeni firma publish checklist

1. Bu repo'yu kopyalayın (veya GitHub template olarak kullanın).
2. `.env` oluşturun:
   - `GOTUR_API_URL` — goturyzhn API adresi (`.../api`)
   - `GOTUR_TENANT_KEY` / `GOTUR_API_KEY` — firma API kimlikleri
   - `SITE_URL` — canlı domain (SEO schema için, sonda `/` olmasın)
   - `PORT` — dinlenecek port (varsayılan `5000`)
3. `config/site.example.json` dosyasını `config/site.json` olarak kopyalayıp doldurun (veya mevcut `site.json`'ı düzenleyin).
4. `public/images/` altına logo, hero, kurumsal ve rota görsellerini koyun (`site.json` içindeki dosya adlarıyla eşleşmeli).
5. `npm install && npm start`
6. Process manager ile ayakta tutun (ör. `pm2 start app.js --name firma-sitesi`).

## Ne nerede?

| Dosya | Ne değişir |
|-------|------------|
| `config/site.json` | Firma adı, renkler, telefon, hero, kampanyalar, FAQ, kurumsal metin, şubeler |
| `.env` | API sırları + `SITE_URL` + `PORT` |
| `public/images/` | Logo, hero, kurumsal, rota görselleri |
| Pug / JS / CSS | Ortak şablon — genelde dokunmayın |

Metinlerde `{{name}}` kullanırsanız, yükleme sırasında firma adıyla değiştirilir.

## SEO

- Sayfa bazlı `title` / `description` / canonical / Open Graph
- `/robots.txt` ve `/sitemap.xml` (SITE_URL gerekir)
- Popüler hatlar: `popularCities` → otomatik `/rota/:slug` landing sayfaları
- Ödeme, profil, biletlerim: `noindex`

## API bağımlılığı

Bilet arama, koltuk, ödeme, üyelik ve biletlerim goturyzhn `/api` üzerinden çalışır. Site tek başına sefer verisi tutmaz; doğru tenant key/api key olmadan arama boş döner.

## Klasör yapısı

```
config/site.json          # firma içeriği
config/site.example.json  # boş şablon
app.js                    # Express giriş
controllers/              # sayfa + API proxy
utilities/goturApi.js     # API client
utilities/loadSiteConfig.js
views/                    # Pug şablonları
public/                   # css, js, images
```
