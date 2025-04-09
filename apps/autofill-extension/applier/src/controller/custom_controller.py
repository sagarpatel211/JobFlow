import pdb

import pyperclip
from typing import Optional, Type
from pydantic import BaseModel
from browser_use.agent.views import ActionResult
from browser_use.browser.views import BrowserState
from browser_use.browser.context import BrowserContext
from browser_use.controller.service import Controller, DoneAction
from main_content_extractor import MainContentExtractor
from browser_use.controller.views import (
    ClickElementAction,
    DoneAction,
    ExtractPageContentAction,
    GoToUrlAction,
    InputTextAction,
    OpenTabAction,
    ScrollAction,
    SearchGoogleAction,
    SendKeysAction,
    SwitchTabAction,
)
import logging

logger = logging.getLogger(__name__)


class CustomController(Controller):
    def __init__(self, exclude_actions: list[str] = [],
                 output_model: Optional[Type[BaseModel]] = None
                 ):
        super().__init__(exclude_actions=exclude_actions, output_model=output_model)
        self._register_custom_actions()

    def _register_custom_actions(self):
        """Register all custom browser actions"""

        @self.registry.action("Copy text to clipboard")
        def copy_to_clipboard(text: str):
            pyperclip.copy(text)
            return ActionResult(extracted_content=text)

        @self.registry.action("Paste text from clipboard")
        async def paste_from_clipboard(browser: BrowserContext):
            text = pyperclip.paste()
            # send text to browser
            page = await browser.get_current_page()
            await page.keyboard.type(text)

            return ActionResult(extracted_content=text)

        # @self.registry.action("upload_file")
        # async def upload_file(browser: BrowserContext, index: int):
        #     page = await browser.get_current_page()
        #     file_buttons = await page.query_selector_all("button:has-text('Select file')")
        #     if not file_buttons:
        #         print("\033[31mNo file upload button found.\033[0m")
        #         return ActionResult(extracted_content=None, error="No file upload button found.", is_done=False)
        #     if index < 0 or index >= len(file_buttons):
        #         print("\033[31mProvided index %s out of range, using index 0 instead.\033[0m" % index)
        #         index = 0
        #     file_button = file_buttons[index]
        #     print("\033[31mClicking file upload button at index %s\033[0m" % index)
        #     async with page.expect_file_chooser() as fc_info:
        #         await file_button.click(no_wait_after=True)
        #     file_chooser = await fc_info.value
        #     print("\033[31mFile chooser event captured. Uploading file 'C:\\Users\\Sagar\\Downloads\\1.pdf'\033[0m")
        #     await file_chooser.set_files("C:\\Users\\Sagar\\Downloads\\1.pdf")
        #     print("\033[31mFile upload complete.\033[0m")
        #     return ActionResult(extracted_content="1.pdf", error=None, is_done=False)


        @self.registry.action("upload_file")
        async def upload_file(browser: BrowserContext, element_index: int, file_path: str = "/home/spate275-local/Downloads/1.pdf"):
            page = await browser.get_current_page()
            
            # Get the specific element by its index
            # The agent uses browser.state.elements which contains all interactive elements
            elements = await page.get_elements()
            
            if not elements:
                print("\033[31mNo elements found on page.\033[0m")
                return ActionResult(extracted_content=None, error="No elements available on page.", is_done=False)
            
            if element_index < 0 or element_index >= len(elements):
                print(f"\033[31mElement index {element_index} is out of range (0-{len(elements)-1}).\033[0m")
                return ActionResult(extracted_content=None, error=f"Element index {element_index} out of range.", is_done=False)
            
            # Get the element at the specified index
            element = elements[element_index]
            print(f"\033[32mAttempting to upload file using element at index {element_index}\033[0m")
            
            try:
                # Try to directly set input files if it's a file input
                await element.set_input_files(file_path)
                print(f"\033[32mDirect file upload successful: {file_path}\033[0m")
            except Exception as e:
                print(f"\033[33mDirect upload failed, trying to click element and handle file chooser: {e}\033[0m")
                try:
                    # If direct upload fails, try clicking the element and handling the file chooser
                    async with page.expect_file_chooser() as fc_info:
                        await element.click(no_wait_after=True)
                    file_chooser = await fc_info.value
                    await file_chooser.set_files(file_path)
                    print(f"\033[32mFile upload via chooser successful: {file_path}\033[0m")
                except Exception as e2:
                    print(f"\033[31mFile upload failed: {e2}\033[0m")
                    return ActionResult(extracted_content=None, error=f"Upload failed: {e2}", is_done=False)
            
            return ActionResult(extracted_content=file_path.split("\\")[-1], error=None, is_done=False)