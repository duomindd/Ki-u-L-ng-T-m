# Discord Voice Bot 24/7

Bot Discord để treo voice chat 24/7 trên Render với các tính năng:
- Treo voice chat tự động reconnect
- Gửi tin nhắn và ảnh qua slash command
- Chào mừng thành viên mới
- Tính năng random mute (minigame)
- Check avatar và thông tin người dùng
- Ping bot và xem thông tin hệ thống

## Cài đặt

1. Clone repository này
2. Cài đặt dependencies:
```bash
npm install
```

3. Cấu hình biến môi trường trong file `.env`:
```
TOKEN=your_discord_bot_token
OWNER_ID=your_discord_user_id
MY_GUILD_ID=your_server_id
COMMAND_GUILD_ID=
WELCOME_CHANNEL_ID=welcome_channel_id
```

## Chạy locally

```bash
npm start
```

## Deploy lên Render

### Cách 1: Sử dụng render.yaml (Khuyên dùng)

1. Push code lên GitHub (nhớ không push file `.env`)
2. Vào [Render Dashboard](https://dashboard.render.com/)
3. Tạo "New Web Service"
4. Kết nối GitHub repository
5. Render sẽ tự động đọc file `render.yaml` để cấu hình
6. Thêm các biến môi trường trong Render Dashboard:
   - `TOKEN`: Discord bot token của bạn
   - `OWNER_ID`: ID Discord của bạn
   - `MY_GUILD_ID`: ID server Discord chính
   - `COMMAND_GUILD_ID`: (Tùy chọn) ID server để test slash commands
   - `WELCOME_CHANNEL_ID`: ID kênh chào mừng

### Cách 2: Manual cấu hình

1. Push code lên GitHub
2. Vào Render Dashboard → New Web Service
3. Cấu hình:
   - Name: discord-voice-bot-247
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node index.js`
4. Thêm các biến môi trường như ở trên

## Các lệnh Slash

- `/text` - Gửi tin nhắn hoặc ảnh (chỉ owner)
- `/join` - Bot vào kênh voice bạn đang ở
- `/leave` - Bot rời kênh voice hiện tại
- `/randommute` - Bật/tắt chế độ random mute
- `/avatar` - Check avatar người dùng
- `/user` - Xem thông tin chi tiết người dùng
- `/ping` - Kiểm tra độ trễ và thông tin hệ thống

## Lưu ý quan trọng

- **KHÔNG ĐƯỢC** push file `.env` lên GitHub
- File `.gitignore` đã được cấu hình để tránh commit file nhạy cảm
- Bot sẽ tự động reconnect khi mất kết nối voice
- Render sẽ giữ bot online 24/7 với web server

## Troubleshooting

- Nếu bot không online: Kiểm tra token có đúng không
- Nếu không join được voice: Kiểm tra quyền Connect và Speak
- Nếu slash commands không hoạt động: Đợi 1-2 giờ để Discord cache cập nhật, hoặc set COMMAND_GUILD_ID