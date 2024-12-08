from openai import OpenAI
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

import requests
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from PIL import Image
import subprocess
import os

import base64

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI()

# Initialize FastAPI app
app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define a Pydantic model for request validation
class ChatRequest(BaseModel):
    message: str

class KeywordRequest(BaseModel):
    keywords: list[str]

class PhotoUploadRequest(BaseModel):
    photos: list[str]

# Define a root endpoint
@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}

# Make a summary and keywords for user input.
@app.post("/api/summarize-day")
async def summarize_day(request: ChatRequest):
    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=
            [
                {
                    "role": "system",
                    "content": """
                    You are going to summarize the user input.
                    User input is going to be the daily report.
                    Summarize it in one or two sentences.
                    After summarizing, give the user the keywords of today separated by comma, 
                    start the sentence by \"Keywords: \".
                    If user input is unexpected, respond 
                    \"Hmm, I think it's not about your day. Please make another input.\"
                    Make all response in English.
                    """
                },
                {
                    "role": "user",
                    "content": request.message
                }
            ]
        )
        response = completion.choices[0].message.content
        summary = ""
        keywords = []

        if (response.startswith("Hmm, ")):
            summary = response
        else:
            summary = response.split(':')[0][:-len(" Keywords")]
            keywords = response.split(':')[1].strip().split(',')

        return {
            "message": summary,
            "keywords": keywords
        }
    
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/upload-photos")
async def get_photos(request: PhotoUploadRequest):
    try:
        save_path = "user_photos"
        os.makedirs(save_path, exist_ok=True)

        for idx, photo_base64 in enumerate(request.photos):
            photo_data = base64.b64decode(photo_base64)

            file_path = os.path.join(save_path, f"photo_{idx}.png")
            with open (file_path, "wb") as f:
                f.write(photo_data)

        return {"message": f"File uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
    
@app.post("/api/generate-stickers")
async def generate_sticker(request: KeywordRequest):
    try:
        sticker_prompt = """
            Make more than 5 stickers.
            The theme of stickers is """ + ", ".join(request.keywords) + """
            . The background color must be blank white to be printed out on the paper.
            The stickers should have dotted line boudaries.
            The stickers are going to be printed out so those stickers should not be overlaped each other."
            """
        print (sticker_prompt)

        response = client.images.generate(
            model="dall-e-3",
            prompt=sticker_prompt,
            size="1792x1024",
            quality="standard",
            n=1
        )

        image_url = response.data[0].url
        print(f"{image_url}")

        create_pdf(image_url, "stickers.pdf")

        return {"message": image_url}

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/print-sticker")
async def print_sticker ():
    try:
        pdf_file = "stickers.pdf"

        printer = subprocess.check_output(["lpstat", "-d"], text=True).splitlines()
        printer = printer[0].split(':')[1].strip()
        print(printer)

        print_command = f"lp -d {printer} {pdf_file}"
        subprocess.run (print_command, shell=True, check=True)

        return {
            "message": f"PDF '{pdf_file}' sent to the default printer successfully.",
            "printers": printer,
        }
    
    except subprocess.CalledProcessError as e:
        print (f"Error occurred while printing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to print: {str(e)}")
    except Exception as e:
        print(f"Unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

def create_pdf(image_url, pdf_file):
    response = requests.get(image_url)
    if response.status_code == 200:
        with open ("stickers.png", 'wb') as file:
            file.write (response.content)
    else:
        print("failed")

    a4_width, a4_height = A4

    # Open the PNG file
    img = Image.open("stickers.png")
    img_width, img_height = img.size

    # 비율 계산 (A4에 맞게 축소)
    scale = min(a4_width / img_width, a4_height / img_height)
    new_width = img_width * scale
    new_height = img_height * scale

    # PDF 생성
    c = canvas.Canvas(pdf_file, pagesize=A4)

    # 이미지 위치 (중앙 정렬)
    x = (a4_width - new_width) / 2
    y = (a4_height - new_height) / 2

    # 이미지 추가
    c.drawImage("stickers.png", x, y, width=new_width, height=new_height)

    # PDF 저장
    c.showPage()
    c.save()

    print(f"PDF created at: {pdf_file}")

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)