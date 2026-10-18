.. figure:: https://raw.githubusercontent.com/aperion-search/KCH-Connect/refs/heads/main/logo/6179493779375591444_121.jpg
   :alt: KCH-Logo
   :width: 100%
   :align: center

----

KCH Connect
===========

KCH Connect is a comprehensive school and madrasa management portal
featuring attendance tracking, student & teacher management, leave
requests, event photo galleries, and reliable cloud synchronization with
**Mega Cloud Storage**.

--------------

Features
--------

- **Role-Based Access Control**:

  - **Admin**: Full control over students, teachers, classes
    assignment, attendance, leave approvals/rejections, and media
    galleries.
  - **Teachers**: View and mark attendance and view leave requests for
    their assigned classes.
  - **Parents / Students**: View student profile details, attendance
    history, and submit leave requests.

- **Mega Cloud Storage Sync**: Automatic backup and syncing of JSON
  data (``KCH_Connect_Backups``) and media files
  (``KCH_Connect_Media``) using ``megajs``.

- **Attendance & Leave Management**:

  - Daily Present, Absent, and Leave tracking with WhatsApp messaging
    and direct phone call (``tel:``) buttons.
  - Monthly attendance grid export to Excel (``.xls`` format with
    proper date cell formatting).

- **Gallery & Media Uploads**: Event photo gallery with multi-folder
  support, local storage, and Mega cloud sync.

- **Mobile Responsive**: Fully responsive UI built with Tailwind CSS,
  custom Arabic typography (``Kanz-al-Marjaan``), and FontAwesome
  icons.

--------------

Project Structure
-----------------

- ``server.js`` — Node.js / Express backend server with atomic JSON
  reads/writes, 50MB payload limits, and startup cloud synchronization.
- ``sync.js`` — Mega cloud storage integration (``megajs``).
- ``frontend/`` — React single-page application (Vite + Tailwind CSS).
- ``data/`` — Local JSON store (synchronized with Mega cloud storage).
- ``public/uploads/`` — Local media storage (synchronized with Mega
  cloud storage).

--------------

Getting Started
---------------

Prerequisites
~~~~~~~~~~~~~

- Node.js (v18 or higher recommended)
- npm

Installation & Setup
~~~~~~~~~~~~~~~~~~~~

1. **Clone the repository**:

   .. code:: bash

      git clone https://github.com/your-username/KCH_Connect.git
      cd KCH_Connect

2. **Install backend dependencies**:

   .. code:: bash

      npm install

3. **Install frontend dependencies**:

   .. code:: bash

      cd frontend
      npm install
      cd ..

4. **Configure Environment Variables**: Create a ``.env`` file in the
   root directory:

   .. code:: text

      PORT=3000
      MEGA_EMAIL=your-mega-email@gmail.com
      MEGA_PASSWORD=your-mega-password

5. **Build the Frontend**:

   .. code:: bash

      cd frontend
      npm run build
      cd ..

6. **Start the Server**:

   .. code:: bash

      node server.js

   Open ``http://localhost:3000`` in your browser.

--------------

License
-------

This project is licensed under the MIT License.
