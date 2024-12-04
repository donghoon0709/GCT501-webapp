from openai import OpenAI
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

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

class ImageRequest(BaseModel):
    message: str


# Define a root endpoint
@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}

# Define a chat endpoint
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": request.message}
            ]
        )
        return {"message": completion.choices[0].message.content}
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=request.message,
            size="1024x1024",
            quality="standard",
            n=1
        )

        image_url = response.data[0].url
        print(f"{image_url}")
        return {"message": image_url}

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)