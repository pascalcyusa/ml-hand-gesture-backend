import time
from playwright.sync_api import sync_playwright

def verify_theme():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to the app (assuming default vite port 5173)
        page.goto("http://localhost:5173")

        # Wait for the page to load
        page.wait_for_selector('main', timeout=10000)

        # Take a screenshot of the main Train tab
        page.screenshot(path="verification_train.png")
        print("Screenshot of Train tab saved.")

        # Navigate to Piano tab
        # Find the link to piano
        # The header navigation might be icon based or text based.
        # Let's try to find by href or click.
        # Based on App.jsx routes: /piano
        page.goto("http://localhost:5173/piano")
        time.sleep(2) # wait for lazy load
        page.screenshot(path="verification_piano.png")
        print("Screenshot of Piano tab saved.")

        # Navigate to Dashboard
        page.goto("http://localhost:5173/dashboard")
        time.sleep(2)
        page.screenshot(path="verification_dashboard.png")
        print("Screenshot of Dashboard saved.")

        browser.close()

if __name__ == "__main__":
    verify_theme()
