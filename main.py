from backend.main import app

if __name__ == "__main__":
    import uvicorn

    # Run the app for local development. Reload will watch files for changes.
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
