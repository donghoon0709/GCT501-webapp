from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from PIL import Image

def create_pdf(image_url, pdf_file):
    # response = requests.get(image_url)
    # if response.status_code == 200:
    #     with open ("stickers.png", 'wb') as file:
    #         file.write (response.content)
    # else:
    #     print("failed")

    a4_width, a4_height = A4

    # Open the PNG file
    photo_img = [Image.open(f"user_photos/photo_{i}.png") for i in range(4)]
    sticker_img = Image.open("stickers.png")

    photo_width, photo_height = photo_img[0].size
    sticker_width, sticker_height = sticker_img.size

    # 비율 계산 (A4에 맞게 축소)
    sticker_scale = min(a4_width / sticker_width, a4_height / sticker_height) * 0.9
    sticker_new_width = sticker_width * sticker_scale
    sticker_new_height = sticker_height * sticker_scale

    photo_scale = min(a4_width / photo_width / 2, a4_height / photo_height / 2) * 0.9
    photo_new_width = photo_width * photo_scale
    photo_new_height = photo_height * photo_scale

    # PDF 생성
    c = canvas.Canvas(pdf_file, pagesize=A4)

    # 이미지 위치 (중앙 정렬)
    x = (a4_width - sticker_new_width) / 2
    y = a4_height * 0.05
    c.drawImage("stickers.png", x, y, width=sticker_new_width, height=sticker_new_height)

    for i in range(4):
        x = i % 2
        y = i // 2
        
        x = x * photo_new_width + 25
        y = (a4_height/2 + y * photo_new_height) - 40
        c.drawImage(f"user_photos/photo_{i}.png", x, y, width=photo_new_width, height=photo_new_height)

    # PDF 저장
    c.showPage()
    c.save()

    print(f"PDF created at: {pdf_file}")

create_pdf("", "output.pdf")