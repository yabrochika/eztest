# Screenshots Directory

This directory contains screenshots for the EZTest application used in documentation and the main README.

## Directory Structure

```
docs/images/screenshots/
├── README.md (this file)
├── Home_Page.png (Public landing page)
├── Project_List_Page.png (Projects page after login)
├── Project_Detail_Page.png
├── TestCase_List_Page.png
├── TestCase_Detail_Page.png
├── TestRun_List_Page.png
├── TestRun_Detail_Page.png
├── Defects_List_Page.png
├── Defects_Detail_Page.png
├── Login_Page.png
├── Register_Page.png
├── Test_Suite_List_Page.png
├── Test_Suite_Detail_Page.png
├── Module_List_Page.png
└── [Dialog screenshots - see below]
```

## Core Screenshots

### 1. Public Homepage (`Home_Page.png`)
**Page:** `/` (Public landing page - shown to visitors **before login or register**)  
**What to capture:**
- Hero section with application name and tagline
- Features grid or highlights showcasing key capabilities
- Call-to-action buttons (e.g., "Get Started", "Try Demo")
- Statistics or key benefits of the application
- Navigation links to login and register pages
- This is the first page users see when visiting the application (for non-authenticated users)
- After login, users are redirected to the Projects page

### 2. Projects List / Homepage (`Project_List_Page.png`)
**Page:** `/projects` (Main landing page **after login** - this is where authenticated users land)  
**What to capture:**
- Projects list/grid view
- Search and filter functionality
- Create project button/action
- Project cards with statistics
- This is the main homepage that authenticated users see after logging in

### 3. Project Detail (`Project_Detail_Page.png`)
**Page:** `/projects/[id]`  
**What to capture:**
- Project detail page with tabs (Overview, Test Suites, Test Cases, Test Runs, Defects, Members, Settings)
- Project statistics
- Project information
- Navigation tabs visible

### 4. Test Cases List (`TestCase_List_Page.png`)
**Page:** `/projects/[id]/testcases`  
**What to capture:**
- Test cases list/table view
- Test case filters and search
- Test case creation button
- Status badges and priorities

### 5. Test Case Detail (`TestCase_Detail_Page.png`)
**Page:** `/projects/[id]/testcases/[tcId]`  
**What to capture:**
- Test case title and metadata
- Test case description
- Test steps with expected results
- Attachments section
- Linked defects or execution history

### 6. Test Runs List (`TestRun_List_Page.png`)
**Page:** `/projects/[id]/testruns`  
**What to capture:**
- Test runs list
- Test run status and progress indicators
- Filter and search options
- Create test run button

### 7. Test Run Execution (`TestRun_Detail_Page.png`)
**Page:** `/projects/[id]/testruns/[runId]`  
**What to capture:**
- Active test run execution interface
- Progress overview/percentage
- Test case list with status indicators
- Result recording interface (Pass/Fail/Skip buttons)
- Comment entry field

### 8. Defects List (`Defects_List_Page.png`)
**Page:** `/projects/[id]/defects`  
**What to capture:**
- Defects list/table
- Defect status badges
- Severity and priority indicators
- Filter and search functionality
- Create defect button

### 9. Defect Detail (`Defects_Detail_Page.png`)
**Page:** `/projects/[id]/defects/[defectId]`  
**What to capture:**
- Defect title and metadata
- Defect description and details
- Status, severity, and priority
- Comments and attachments
- Linked test cases

### 10. Login Page (`Login_Page.png`)
**Page:** `/auth/login`  
**What to capture:**
- Login form
- Email and password fields
- Login button
- Forgot password link
- Registration link

## Additional Screenshots

### 11. Register Page (`Register_Page.png`)
**Page:** `/auth/register`  
**What to capture:**
- User registration form
- Required fields (name, email, password)
- Terms and conditions checkbox
- Register button

### 12. Test Suites List (`Test_Suite_List_Page.png`)
**Page:** `/projects/[id]/testsuites`  
**What to capture:**
- Test suites hierarchical view
- Test suite organization
- Test cases within suites
- Create test suite functionality

### 13. Test Suite Detail (`Test_Suite_Detail_Page.png`)
**Page:** `/projects/[id]/testsuites/[suiteId]`  
**What to capture:**
- Test suite details
- Test cases in the suite
- Suite organization structure
- Execution options

### 14. Modules List (`Module_List_Page.png`)
**Page:** `/projects/[id]/modules`  
**What to capture:**
- Modules list view
- Module organization
- Test cases grouped by module
- Create module functionality

## Dialog Screenshots (Optional)

These screenshots show the various create/edit dialogs in the application:
- `Create_Project_Dialog.png` - Create project dialog
- `Create_TestCase_Dialog.png` - Create test case dialog
- `Create_Test_Suite_Dialog.png` - Create test suite dialog
- `Create_TestRun_Dialog.png` - Create test run dialog
- `Create_Defect_Dialog.png` - Create defect dialog

## Security Notes

⚠️ **Important:** The following types of screenshots have been removed for security reasons:
- Admin pages that may expose user data or system information
- Dialogs that may contain sensitive user information (e.g., member assignment dialogs with user emails)

Always ensure screenshots use demo/test data and never include:
- Real user email addresses
- Real user names or personal information
- API keys or secrets
- Production database information
- Internal system paths or configurations

## Screenshot Guidelines

### Technical Specifications
- **Format:** PNG (preferred) or JPG
- **Resolution:** 1920x1080 (Full HD) or 1280x720 (HD)
- **Aspect Ratio:** 16:9 (landscape)
- **File Size:** Keep under 500KB per image (optimize if needed)
- **Naming Convention:** Use Pascal_Case for consistency (e.g., `TestCase_Detail_Page.png`) or kebab-case

### Content Guidelines
- Use **real or realistic demo data** - avoid placeholder text like "Lorem ipsum"
- Ensure screenshots show **meaningful content** that demonstrates the feature
- **Hide sensitive information** - blur or redact any real user data, API keys, or confidential information
- Use **consistent browser zoom level** (100% recommended)
- Ensure **UI is fully loaded** before capturing
- **Remove browser UI** if possible (use browser screenshot tools or developer tools)

### Browser & Display
- Use a **modern browser** (Chrome, Firefox, or Edge)
- Use **default browser theme** for consistency
- Ensure the **viewport is clean** (no extensions, bookmarks bar visible if needed)
- Consider using **browser developer tools** for clean screenshots

### Optimization
- Use tools like [TinyPNG](https://tinypng.com/) or [ImageOptim](https://imageoptim.com/) to compress images
- Ensure images are optimized for web without losing quality
- Consider creating thumbnails if full-size images are too large

## How to Take Screenshots

### Using Browser Developer Tools
1. Open the page in your browser
2. Press `F12` to open Developer Tools
3. Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac) and type "screenshot"
4. Select "Capture full size screenshot" or "Capture node screenshot"
5. Save the file with the appropriate name

### Using Browser Extensions
- **Firefox:** Use built-in screenshot tool
- **Chrome:** Use extensions like "Full Page Screen Capture" or "Awesome Screenshot"

### Using Command Line (Chrome/Edge)
```bash
# Take screenshot of a URL
chrome --headless --screenshot --window-size=1920,1080 http://localhost:3000/projects
```

## Updating Screenshots

When updating screenshots:
1. Take new screenshots following the guidelines above
2. Replace existing files with the same name
3. Update this README if new screenshots are added or removed
4. Ensure all screenshots reflect the current UI state
5. Test that images display correctly in the main README

## Notes

- Screenshots should be updated when major UI changes are made
- Keep screenshots synchronized with the current application version
- If a feature is deprecated, remove its screenshot and update documentation
