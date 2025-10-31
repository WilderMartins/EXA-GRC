from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the page and clear localStorage to ensure a fresh install state
        page.goto("http://localhost:3000", timeout=30000)
        page.evaluate("localStorage.clear()")
        page.reload() # Reload the page to apply the cleared state

        # Give the app a moment to re-initialize
        time.sleep(2)

        # Wait for the wizard to appear and verify the title
        expect(page.get_by_role("heading", name="Instalação - EXA GRC")).to_be_visible(timeout=15000)

        # Verify that the new "Segurança" step is present in the stepper UI
        expect(page.get_by_text("Segurança")).to_be_visible()

        # Take a screenshot to visually confirm the new stepper UI
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot successful!")

    except Exception as e:
        print(f"An error occurred: {e}")
        # Always take a screenshot on error for debugging
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
