# Software Requirements Specification (SRS)

## Project: ELigtas

### Founder: Johan B: Adonis

### Version: 1.0

### Date: October 31, 2025

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document defines the requirements for **ELigtas**, a mobile and web application developed by **Adonis**. ELigtas enables users to collect, organize, and manage videos they have saved across social media platforms (such as YouTube, TikTok, and Instagram) into categorized topics using AI-based classification.

### 1.2 Scope

ELigtas aggregates saved videos from multiple social media accounts and organizes them by content topics such as Cooking, Tech Tips, Travel, Fitness, etc. The application will allow users to connect their social media accounts, automatically import saved videos, categorize them intelligently using AI, and enable manual reorganization and tagging.

### 1.3 Definitions, Acronyms, and Abbreviations

* **AI:** Artificial Intelligence
* **API:** Application Programming Interface
* **OAuth:** Open Authorization protocol for user authentication
* **UI/UX:** User Interface / User Experience
* **MVP:** Minimum Viable Product

### 1.4 References

* IEEE Std 830-1998, IEEE Recommended Practice for Software Requirements Specifications
* YouTube Data API v3 documentation
* TikTok Developer API documentation
* Instagram Graph API documentation
* OpenAI API documentation

---

## 2. Overall Description

### 2.1 Product Perspective

ELigtas is an independent cloud-connected application with integrations to external social media APIs. It consists of:

* A **frontend** mobile app (React Native/Expo)
* A **backend API** (Node.js/Express)
* A **database** (PostgreSQL)
* **AI classification service** (OpenAI API)

### 2.2 Product Functions

* Connect user’s social media accounts (YouTube, TikTok, Instagram)
* Import saved or liked videos
* Automatically categorize videos using AI
* Allow user tagging, notes, and manual reorganization
* Provide in-app video playback
* Search and filter by topic, tag, or keyword

### 2.3 User Characteristics

* **Primary users:** Social media users, content creators, and enthusiasts who save multiple videos across platforms.
* **Technical proficiency:** Moderate (typical smartphone app users).

### 2.4 Constraints

* API access is limited by platform (e.g., TikTok’s restricted endpoints)
* Requires internet connectivity for AI and data sync
* Must comply with privacy laws (GDPR, CCPA)

### 2.5 Assumptions and Dependencies

* Users have valid accounts on social media platforms.
* OpenAI API key will be available for AI categorization.
* External APIs (YouTube, TikTok, Instagram) remain stable.

---

## 3. System Features

### 3.1 Authentication & User Management

**Description:** Users can create accounts via email/password or OAuth. They can link multiple social media accounts.

* **Inputs:** Email, password, OAuth token
* **Outputs:** Authenticated session (JWT)
* **Functional Requirements:**

  1. User shall register and log in using email and password.
  2. User shall connect/disconnect social media accounts.
  3. User shall reset their password.

### 3.2 Video Import

**Description:** The system fetches saved or liked videos from connected platforms.

* **Inputs:** OAuth credentials
* **Outputs:** Video metadata stored in database
* **Functional Requirements:**

  1. The system shall fetch user’s saved videos using social media APIs.
  2. The system shall allow manual video import via link.
  3. The system shall refresh imported videos daily via background jobs.

### 3.3 AI Categorization

**Description:** Automatically classifies videos into relevant topics.

* **Inputs:** Video title, description, transcript
* **Outputs:** Category label and confidence score
* **Functional Requirements:**

  1. The system shall send metadata to the AI service for classification.
  2. The AI shall return a single best-fit category with confidence.
  3. The user may override or reassign the AI-generated category.

### 3.4 Organization and Tagging

**Description:** Users can manage video organization manually.

* **Functional Requirements:**

  1. Users can create, edit, and delete tags.
  2. Users can move videos between categories.
  3. Users can add text notes to videos.
  4. Videos can be reordered using drag-and-drop.

### 3.5 Search and Filter

**Functional Requirements:**

1. Users can search by keyword.
2. Users can filter by category, tag, or platform.
3. The system shall return results with relevance ranking.

### 3.6 Video Playback

**Functional Requirements:**

1. Videos shall be playable via embedded YouTube/TikTok/Instagram players.
2. The system shall not download or host the video itself.

---

## 4. External Interface Requirements

### 4.1 User Interface

* Mobile interface built with React Native (Expo)
* Clean, grid-based layout
* Drag-and-drop interaction for organizing
* Search bar and filter panel

### 4.2 Hardware Interface

* Compatible with iOS (11+) and Android (8+)
* Responsive for web version

### 4.3 Software Interface

* **YouTube Data API v3** for saved videos and metadata
* **TikTok Developer API** for liked videos
* **Instagram Graph API** for saved media (where available)
* **OpenAI API** for text-based categorization

### 4.4 Communications Interface

* HTTPS REST API for backend communication
* JSON as data exchange format

---

## 5. Non-functional Requirements

### 5.1 Performance Requirements

* App should load dashboard within 3 seconds.
* API responses should be under 500ms for cached queries.

### 5.2 Security Requirements

* All communications must use HTTPS.
* OAuth tokens stored encrypted.
* Users can delete their accounts and data.
* JWT tokens for authentication with short expiry.

### 5.3 Reliability

* 99% uptime target.
* Automatic daily database backups.

### 5.4 Maintainability

* Modular architecture with versioned APIs.
* Codebase documented and unit-tested.

### 5.5 Usability

* Simple drag-and-drop UX.
* Intuitive category management.
* Search and filter accessible from any screen.

### 5.6 Scalability

* Support up to 100,000 videos per user.
* Backend horizontally scalable.

---

## 6. System Models

### 6.1 Architecture Diagram (Simplified)

```
[Frontend: React Native]
        ↓
[Backend: Node.js/Express]
        ↓
[Database: PostgreSQL + Redis]
        ↓
[AI Engine: OpenAI API]
        ↓
[External APIs: YouTube, TikTok, Instagram]
```

### 6.2 Data Flow Summary

1. User logs in → backend authenticates via JWT.
2. User connects social accounts → OAuth flow → tokens stored encrypted.
3. Backend fetches saved videos → stores metadata in DB.
4. AI categorization → updates video records.
5. User views dashboard → frontend queries categorized data.

---

## 7. Appendices

### 7.1 AI Categorization Prompt Example

```
Classify the following video into one of: Cooking, Tech Tips, Travel, Fitness, Beauty, DIY, Education, Entertainment, Other.\n\nTitle: <title>\nDescription: <description>\nTranscript: <transcript>
```

### 7.2 Future Enhancements

* Browser extension for saving videos directly.
* Collaboration/sharing of collections.
* Semantic search via embeddings.
* Notifications for new video imports.

### 7.3 Revision History

| Version | Date       | Author          | Description          |
| ------- | ---------- | ----------------| -------------------- |
| 1.0     | 2025-10-31 | Johan B. Adonis | Initial SRS document |

---

**End of Document**
