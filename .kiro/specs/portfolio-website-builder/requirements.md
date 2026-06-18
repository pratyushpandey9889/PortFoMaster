# Requirements Document

## Introduction

The Portfolio Website Builder is a web application that allows users to create, customize, save, and share personal portfolio websites without writing any code. A user signs up, fills out a guided multi-step form with their professional details, selects a visual theme, and receives a unique public URL where their portfolio is accessible to anyone. The product targets beginner to intermediate developers, designers, and other professionals who want an online presence quickly.

---

## Glossary

- **App**: The Portfolio Website Builder web application.
- **User**: An authenticated person who has registered an account.
- **Visitor**: An unauthenticated person viewing a public portfolio page.
- **Portfolio**: The collection of professional information (bio, skills, projects, etc.) belonging to a User.
- **Profile**: The stored data record associated with a User's Portfolio.
- **Editor**: The split-screen interface where a User fills in their Portfolio details and sees a live Preview.
- **Preview**: The real-time rendered view of the User's Portfolio as it will appear publicly.
- **Theme**: A visual template that controls layout, typography, and color scheme of a Portfolio page.
- **Public_Page**: The publicly accessible web page rendered from a User's Portfolio data at a unique URL.
- **Bio_Generator**: The AI-powered service that produces a professional bio summary.
- **Auth_System**: The component responsible for user registration, login, and session management.
- **Form**: The multi-step input interface through which a User enters Portfolio data.
- **Skill_Tag**: A short text label representing a skill (e.g., "Python", "Figma").
- **Social_Link**: A URL connecting a User's profile to an external platform (GitHub, LinkedIn, Twitter, or Email).
- **Unique_URL**: The public address of a Portfolio in the format `yourapp.com/p/{username}`.
- **Username**: A unique identifier chosen or derived at registration, used in the Unique_URL.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a new visitor, I want to create an account with my email and password, so that I can start building and saving my portfolio.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a registration form that accepts an email address, a password, and a chosen Username.
2. WHEN a registration form is submitted, THE Auth_System SHALL validate that the email address follows a standard email format (RFC 5322).
3. WHEN a registration form is submitted, THE Auth_System SHALL validate that the password is at least 8 characters long.
4. WHEN a registration form is submitted, THE Auth_System SHALL validate that the Username contains only alphanumeric characters and hyphens, and is between 3 and 30 characters long.
5. IF the submitted email address already exists in the system, THEN THE Auth_System SHALL display an error message stating that the email is already registered.
6. IF the submitted Username is already taken, THEN THE Auth_System SHALL display an error message stating that the username is unavailable.
7. WHEN all registration fields are valid and unique and the User account is created successfully, THE Auth_System SHALL create an empty Portfolio Profile for that User and redirect the User to the Editor.
8. THE Auth_System SHALL store passwords using a secure one-way hashing algorithm (bcrypt or equivalent) and SHALL NOT store plaintext passwords.

---

### Requirement 2: User Login and Session Management

**User Story:** As a registered user, I want to log in with my email and password, so that I can access and edit my portfolio.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a login form that accepts an email address and a password.
2. WHEN a login form is submitted with a valid email and matching password, THE Auth_System SHALL create an authenticated session and redirect the User to the Editor.
3. IF a login form is submitted with an email that does not exist, THEN THE Auth_System SHALL display a generic error message stating that the credentials are invalid, without revealing which field is incorrect, and SHALL preserve any existing authenticated session.
4. IF a login form is submitted with an incorrect password, THEN THE Auth_System SHALL display a generic error message stating that the credentials are invalid, without revealing which field is incorrect, and SHALL preserve any existing authenticated session.
5. WHILE a User has an authenticated session, THE App SHALL grant access to the Editor and all portfolio management features.
6. WHEN a User logs out, THE Auth_System SHALL invalidate the session and redirect the User to the login page.
7. IF an unauthenticated request is made to a protected route, THEN THE App SHALL redirect the requester to the login page.

---

### Requirement 3: Portfolio Form — Personal Information

**User Story:** As a logged-in user, I want to enter my personal information, so that my portfolio displays my name, title, location, and profile photo.

#### Acceptance Criteria

1. THE Form SHALL provide input fields for the User's full name, professional title, and location.
2. THE Form SHALL provide a profile photo upload control that accepts image files in JPEG, PNG, or WebP format with a maximum file size of 5 MB.
3. WHEN a User submits a profile photo, THE App SHALL store the image and associate it with the User's Profile.
4. IF an uploaded file exceeds 5 MB or is not in an accepted format, THEN THE App SHALL display an error message describing the violation and SHALL NOT save the file to storage.
5. WHEN a User saves personal information, THE App SHALL persist the name, title, location, and photo reference to the User's Profile.

---

### Requirement 4: Portfolio Form — About / Bio Section

**User Story:** As a logged-in user, I want to write or generate a professional bio, so that visitors understand who I am and what I do.

#### Acceptance Criteria

1. THE Form SHALL provide a multi-line text input for the User's bio with a maximum length of 1000 characters.
2. THE Form SHALL display a character counter that updates in real time as the User types in the bio field.
3. WHEN the bio field contains fewer than 1000 characters, THE Form SHALL allow the User to type additional characters.
4. WHEN the bio field reaches 1000 characters, THE Form SHALL prevent the User from entering additional characters and SHALL display a message indicating the limit has been reached.
5. THE Form SHALL provide a "Generate Bio" button that triggers the Bio_Generator.
6. WHEN the "Generate Bio" button is activated and the User's name, professional title, and at least one Skill_Tag have been provided, THE Bio_Generator SHALL produce a professional bio of 3 to 4 sentences and immediately populate the bio field with the result.
7. IF the "Generate Bio" button is activated and the User's name, professional title, or Skill_Tags are missing, THEN THE App SHALL validate first, display an error message listing the required fields, and SHALL NOT attempt generation.
8. WHEN a generated bio is displayed, THE Form SHALL allow the User to either keep, regenerate, or manually edit the bio text.

---

### Requirement 5: Portfolio Form — Skills

**User Story:** As a logged-in user, I want to add skill tags to my portfolio, so that visitors can quickly see my areas of expertise.

#### Acceptance Criteria

1. THE Form SHALL provide a skill input field where the User can type a Skill_Tag and add it to their Skills list.
2. WHEN the User adds a Skill_Tag, THE App SHALL display it as a removable tag in the Skills section of the Form.
3. THE App SHALL allow a User to add up to 30 Skill_Tags to their Profile.
4. IF a User attempts to add a Skill_Tag that is identical (case-insensitive) to one already in their Skills list, THEN THE App SHALL ignore the duplicate and SHALL NOT add it again.
5. WHEN a User removes a Skill_Tag, THE App SHALL remove it from the displayed list and from the User's Profile upon the next save.
6. THE App SHALL support Skill_Tag values between 1 and 50 characters in length.

---

### Requirement 6: Portfolio Form — Work Experience

**User Story:** As a logged-in user, I want to add my work experience, so that visitors can see my professional history.

#### Acceptance Criteria

1. THE Form SHALL provide controls to add one or more Work Experience entries, each containing a company name, job role, start date, end date (or a "Current" indicator), and a description.
2. WHEN a User adds a Work Experience entry, THE App SHALL display it in the Work Experience list within the Form.
3. THE App SHALL allow a User to add up to 20 Work Experience entries to their Profile.
4. THE Form SHALL allow a User to mark a Work Experience entry as current, in which case THE App SHALL display "Present" as the end date on the Public_Page.
5. WHEN a User deletes a Work Experience entry, THE App SHALL mark it for removal and retain it as visually removed in the list until the User saves, at which point THE App SHALL remove it from the User's Profile.
6. THE Form SHALL enforce a maximum description length of 500 characters per Work Experience entry.

---

### Requirement 7: Portfolio Form — Projects

**User Story:** As a logged-in user, I want to showcase my projects, so that visitors can see examples of my work.

#### Acceptance Criteria

1. THE Form SHALL provide controls to add one or more Project entries, each containing a title, description, a list of technologies used, an optional GitHub URL, and an optional live demo URL.
2. WHEN a User adds a Project entry, THE App SHALL display it in the Projects list within the Form.
3. THE App SHALL allow a User to add up to 20 Project entries to their Profile.
4. IF a User provides a GitHub URL or live demo URL, THEN THE App SHALL validate that the value begins with "https://" before saving.
5. IF any URL field in a Project entry contains a value that does not begin with "https://", THEN THE App SHALL display error messages on all invalid URL fields within that Project entry.
6. WHEN a User deletes a Project entry, THE App SHALL remove it from the list and from the User's Profile upon the next save.
7. THE Form SHALL enforce a maximum description length of 500 characters per Project entry.

---

### Requirement 8: Portfolio Form — Education

**User Story:** As a logged-in user, I want to add my educational background, so that visitors can see my academic qualifications.

#### Acceptance Criteria

1. THE Form SHALL provide controls to add one or more Education entries, each containing a degree or qualification name, an institution name, and a graduation year.
2. WHEN a User adds an Education entry, THE App SHALL display it in the Education list within the Form.
3. THE App SHALL allow a User to add up to 10 Education entries to their Profile.
4. WHEN a User deletes an Education entry, THE App SHALL remove it from the list and from the User's Profile upon the next save.
5. THE Form SHALL validate that the graduation year is a four-digit integer between 1900 and 2100.

---

### Requirement 9: Portfolio Form — Social Links

**User Story:** As a logged-in user, I want to add links to my social profiles, so that visitors can connect with me on other platforms.

#### Acceptance Criteria

1. THE Form SHALL provide optional URL input fields for the following Social_Link types: GitHub, LinkedIn, Twitter, and Email.
2. WHEN a Social_Link URL field is provided, THE App SHALL validate that the value begins with "https://" (or "mailto:" for the Email field) before saving.
3. IF a Social_Link URL field contains an invalid value, THEN THE App SHALL display a field-level error message describing the correct format.
4. WHEN a User saves Social_Links, THE App SHALL persist all provided Social_Link values to the User's Profile.
5. WHEN a Social_Link field is left empty, THE App SHALL omit that link from the Public_Page without displaying an error.

---

### Requirement 10: Theme Selection

**User Story:** As a logged-in user, I want to choose a visual theme for my portfolio, so that it matches my personal style.

#### Acceptance Criteria

1. THE App SHALL provide at least 3 Themes: "Minimal", "Dark", and "Creative".
2. THE App SHALL display each Theme as a selectable thumbnail or card in the Editor.
3. WHEN a Theme is selected and the preview updates, THE App SHALL apply the Theme change within 500 milliseconds; WHERE the Theme selection triggers a page reload, THE App SHALL still reflect the selected Theme within 500 milliseconds of the reload completing.
4. THE App SHALL persist the User's selected Theme to their Profile when the Portfolio is saved.
5. WHEN a Portfolio is rendered on the Public_Page for an active request, THE App SHALL apply the Theme stored in the User's Profile.

---

### Requirement 11: Live Preview

**User Story:** As a logged-in user, I want to see a real-time preview of my portfolio while I fill in the form, so that I know exactly how it will look publicly.

#### Acceptance Criteria

1. THE Editor SHALL display the Form and the Preview side by side in a split-screen layout on screens wider than 1024 pixels.
2. WHEN a User modifies any field in the Form, THE Preview SHALL update to reflect the change within 500 milliseconds without a full page reload.
3. THE Preview SHALL render the Portfolio using the currently selected Theme.
4. WHEN the screen width is 1024 pixels or narrower, THE Editor SHALL stack the Form and Preview vertically and SHALL provide a toggle control to switch between the two views.

---

### Requirement 12: Saving the Portfolio

**User Story:** As a logged-in user, I want to save my portfolio, so that my changes are persisted and reflected on my public page.

#### Acceptance Criteria

1. THE Editor SHALL provide a "Save" button that persists all current Portfolio data to the database.
2. WHEN the "Save" button is activated, THE App SHALL validate all fields and display any validation errors before saving.
3. WHEN all fields are valid and the save operation completes successfully, THE App SHALL display a success notification to the User.
4. IF the save operation fails due to a server or network error, THEN THE App SHALL display an error notification, SHALL retain all unsaved changes in the Form, and SHALL allow the User to navigate away without requiring acknowledgment of the failure.
5. THE App SHALL auto-save the Portfolio no more frequently than once every 30 seconds while the User is actively editing.

---

### Requirement 13: Shareable Public Link

**User Story:** As a logged-in user, I want a unique public URL for my portfolio, so that I can share it with potential employers or clients.

#### Acceptance Criteria

1. THE App SHALL assign every User a Unique_URL of the format `yourapp.com/p/{username}` upon account creation.
2. THE App SHALL display the User's Unique_URL in the Editor.
3. THE Editor SHALL provide a "Copy Link" button that copies the Unique_URL to the user's clipboard.
4. WHEN the "Copy Link" button is activated, THE App SHALL display a confirmation message indicating the link was copied.
5. WHEN a Visitor navigates to a valid Unique_URL, THE App SHALL render the corresponding Public_Page without requiring the Visitor to log in.
6. IF a Visitor navigates to a Unique_URL for a Username that does not exist, THEN THE App SHALL display a 404 page with a message indicating the portfolio was not found.

---

### Requirement 14: Public Portfolio Page

**User Story:** As a visitor, I want to view a user's portfolio at their public URL, so that I can learn about their background and contact them.

#### Acceptance Criteria

1. THE Public_Page SHALL display all non-empty Portfolio sections: Personal Information, Bio, Skills, Work Experience, Projects, Education, and Social_Links.
2. THE Public_Page SHALL omit any section for which the User has provided no data, without displaying empty placeholders.
3. THE Public_Page SHALL render the User's selected Theme.
4. WHEN a Visitor clicks a Social_Link on the Public_Page, THE App SHALL open the link in a new browser tab.
5. THE Public_Page SHALL be accessible without authentication.
6. THE Public_Page SHALL include appropriate HTML meta tags (title, description, Open Graph) using the User's name and bio for link preview generation on social media platforms.

---

### Requirement 15: AI Bio Generation (Bio_Generator)

**User Story:** As a logged-in user, I want to automatically generate a professional bio, so that I don't have to write one from scratch.

#### Acceptance Criteria

1. THE Bio_Generator SHALL accept the User's name, professional title, and list of Skill_Tags as input.
2. WHEN valid input is provided, THE Bio_Generator SHALL return a bio consisting of 3 to 4 sentences within 10 seconds.
3. IF the Bio_Generator service is unavailable or returns an error, THEN THE App SHALL display an error message instructing the User to try again or write the bio manually, and SHALL NOT leave the bio field blank or corrupted.
4. THE App SHALL limit Bio_Generator calls to 10 per User per hour to prevent abuse.
5. WHEN a User reaches the 10th Bio_Generator call within an hour, THE App SHALL immediately display a message indicating the limit has been reached and the time remaining before another generation is allowed.

---

### Requirement 16: Responsive Design

**User Story:** As a user or visitor, I want the app to work well on both desktop and mobile devices, so that I can access or share my portfolio from any device.

#### Acceptance Criteria

1. THE App SHALL render all pages correctly on screen widths from 320 pixels to 2560 pixels.
2. THE Public_Page SHALL be fully readable and navigable on mobile devices without horizontal scrolling.
3. THE Form SHALL be fully operable on touch-screen devices, including skill tag input, file uploads, and multi-entry sections.

---

### Requirement 17: Data Persistence and Profile Management

**User Story:** As a logged-in user, I want my portfolio data to be saved reliably, so that I can return and update it at any time.

#### Acceptance Criteria

1. WHEN a User logs back in after a previous session, THE App SHALL load and display all previously saved Portfolio data in the Editor.
2. THE App SHALL store all Portfolio data in a relational database (PostgreSQL or SQLite).
3. THE App SHALL associate each Portfolio record with exactly one User account through a foreign key relationship.
4. WHEN a User updates and saves their Portfolio, THE App SHALL overwrite the previous Portfolio data with the new data.
5. IF a database storage operation fails, THEN THE App SHALL display an error notification and SHALL allow the User to continue editing without blocking further use of the Editor.
