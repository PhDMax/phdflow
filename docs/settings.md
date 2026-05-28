# Settings, Vault & Personalization

Configure PhDFlow to match your workflow — lock it with a password, store sensitive credentials securely, and customize the look.

---

## App Lock

Password-protect PhDFlow so only you can open it.

### Setting up a password

1. Go to **Settings → App Lock**
2. Enter a new password (minimum 8 characters)
3. Enter your name (shown on the lock screen)
4. Click **Enable App Lock**

PhDFlow will now show a login screen on startup.

### Changing your password

1. Go to **Settings → App Lock**
2. Click **Change Password**
3. Enter your current password, then the new one

### Removing the lock

1. Go to **Settings → App Lock**
2. Click **Disable App Lock** and confirm with your current password

---

## Secure Vault (3FA)

The Vault stores sensitive data (API keys, passwords, tokens) encrypted on your device, protected by three authentication factors.

### Setting up the Vault

1. Go to **Settings → Vault**
2. Click **Set Up Vault**
3. Complete the three-factor setup:
   - **Factor 1** — Master password (choose a strong one separate from your app lock)
   - **Factor 2** — TOTP authenticator code (scan the QR code with Google Authenticator, Authy, etc.)
   - **Factor 3** — Email confirmation (a code is sent to your registered email)
4. Store your recovery codes somewhere safe

### Opening the Vault

Each session you must re-authenticate all three factors:

1. Go to **Settings → Vault**
2. Enter master password → Enter TOTP code → Enter email code
3. The Vault unlocks and shows your entries

### Adding a Vault entry

1. Unlock the Vault
2. Click **+ New Entry**
3. Fill in label, username, password/secret, and notes
4. Click **Save** — entry is encrypted immediately

### Vault auto-lock

The Vault locks automatically after 15 minutes of inactivity or when the app is closed.

---

## Personalization

Customize the app's appearance.

### Accent colour

1. Go to **Settings → Personalize**
2. Under **Accent Colour**, click any colour swatch
3. The UI updates instantly — no restart needed

Available colours: Indigo (default), Violet, Teal, Rose, Amber, Emerald

### Font family

1. Go to **Settings → Personalize**
2. Under **Font**, click a style card
3. The font changes everywhere in the app immediately

Available fonts: System (default), Serif, Monospace, Rounded

### Dashboard widgets

1. Go to **Settings → Personalize**
2. Under **Dashboard Widgets**, toggle each section on or off
3. Changes reflect immediately on the Dashboard

---

## APIs & Feeds

Configure external data sources used by Literature Feed and Discover.

1. Go to **Settings → APIs & Feeds**
2. Add RSS feed URLs for Literature Feed
3. Add arXiv topic keywords
4. Test connectivity with the **Test** button

---

## Data Backup & Restore

### Export all data

1. Go to **Settings → Data**
2. Click **Export** — saves a `.phdflow` backup file to your chosen location

### Import / restore

1. Go to **Settings → Data**
2. Click **Import** — select a `.phdflow` file
3. Confirm — existing data is replaced

### Open data folder

Click **Open Data Folder** to see where PhDFlow stores its files on your computer.

---

## Updates

PhDFlow checks for updates automatically in the background.

- If an update is available, a red dot appears on the **Updates** tab of the login screen
- You can also check manually from the login screen under the **Updates** tab
- Click **↻ Restart & Install Now** to apply a downloaded update
