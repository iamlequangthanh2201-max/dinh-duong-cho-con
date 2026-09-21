# Dinh dưỡng cho con

Sổ tay dinh dưỡng và nếp ăn cho trẻ 0–12 tuổi. Khung lấy từ **食育 shokuiku** và hướng dẫn ăn dặm của Nhật *(授乳・離乳の支援ガイド, bản sửa 2019)*, cộng cách quản lý thực phẩm trẻ em của Hàn Quốc, rồi chuyển hết sang điều kiện khí hậu, chợ búa và gia đình Việt Nam — miền Nam.

Cùng bộ với [Cẩm nang người cha](https://claude.ai/code/artifact/f37dbde6-2eae-493e-b31d-5caa2f23076a) *(EQ)* và [Nền tài chính cho con](https://claude.ai/code/artifact/06f23c50-7c3d-4594-a13e-cf59440b9e0c).

## Nội dung

| File | Chương |
|---|---|
| `00-nghen.md` | ⚠ Nghẹn — làm ngay *(ghim đầu mục lục)* |
| `01-nen-mong.md` | Nền móng — một nguyên tắc, ba trụ, ranh giới cứng |
| `02-an-dam.md` | Ăn dặm — sáu việc trước, bốn giai đoạn sau |
| `03-ban-an-hang-ngay.md` | Bàn ăn hằng ngày — nhịp, bữa phụ, kén ăn |
| `04-mam-com-khi-hau.md` | Mâm cơm & khí hậu — bốn vi chất, uống, an toàn thực phẩm |
| `05-khi-con-o-ben-ngoai.md` | Khi con ở bên ngoài — trường, ông bà, cổng trường, lời về cơ thể |
| `06-kich-ban.md` | 30 kịch bản — tra bằng ô tìm kiếm |
| `07-bang-thuc-pham.md` | 51 thẻ thực phẩm + 4 bảng tra nhanh |
| `08-cong-cu-so.md` | Do & Don't, ba cuốn sổ, 5 bộ thực đơn |

## Dựng lại

```bash
python3 build.py
```

Ghép `styles.css` + `app.js` + các file `.md` thành `index.html` — một file duy nhất, không phụ thuộc gì ngoài font Google.

## Dữ liệu

Sổ họp nền, sổ mốc và sổ tăng trưởng lưu trong `localStorage` của trình duyệt. Khi trang chạy dưới dạng Artifact trên claude.ai thì đồng bộ thêm lên server để mở ở máy khác vẫn thấy.

## Lưu ý

Quyển này không thay bác sĩ. Các mốc *"đi khám khi"* nằm ở cuối chương 02, 03 và trong nhóm H của chương 06.
