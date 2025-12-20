from fastapi import FastAPI

app = FastAPI(title="FacePay API")

@app.get("/")
def root():
    return {"message": "FacePay Backend Running"}
