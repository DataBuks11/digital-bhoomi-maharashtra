import re

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Exact string replacements for HTML/JS
    replacements = {
        # Navigation & Tour
        "📄 1. FE Public": "1. Public Portal",
        "📄 2. FE Influencer": "2. Influencer Portal",
        "📄 3. FE Partner": "3. Partner Portal",
        "📄 4. FE Admin": "4. Admin Console",
        "<span>🎧</span> Start Voice Tour": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg> Voice Tour',
        
        # Public
        '<span class="heart">♥</span>': '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
        "<span>📍</span> Prime Locations": "Prime Locations",
        "<span>🛡️</span> Verified Properties": "Verified Properties",
        "<span>🎧</span> Expert Support": "Expert Support",
        "<span>💎</span> Best Investment": "Best Investment",
        "🔍 Search": "Search",
        "🔍 Check": "Check",
        '<div class="pub-trust-icon">🤝</div>': '<div class="pub-trust-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>',
        '<div class="pub-trust-icon">📍</div>': '<div class="pub-trust-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>',
        '<div class="pub-trust-icon">🛡️</div>': '<div class="pub-trust-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>',
        '<div class="pub-trust-icon">🎧</div>': '<div class="pub-trust-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg></div>',

        # Influencer Sidebar & UI
        "<span>🏠 Dashboard</span>": "<span>Dashboard</span>",
        "<span>👥 Clints</span>": "<span>Clints</span>",
        "<span>₹ Earning</span>": "<span>Earning</span>",
        "<span>🔔 Notification</span>": "<span>Notification</span>",
        "<span>👤 Profile & Bank</span>": "<span>Profile & Bank</span>",
        "🔗 Copy Link": "Copy Link",
        "📥 Download QR": "Download QR",
        "📋 Copy Details": "Copy Details",
        "📋 Copy URL": "Copy URL",
        "📲 Display QR": "Display QR",
        "📷 Instagram": "Instagram",
        "📷 YouTube": "YouTube",
        "📘 Facebook": "Facebook",

        # Partner Sidebar & UI
        "<span>👥 Clients</span>": "<span>Clients</span>",
        "<span>⭐ Shortlisted</span>": "<span>Shortlisted</span>",
        "<span>💼 Funds</span>": "<span>Funds</span>",
        "<span>👤 Profile</span>": "<span>Profile</span>",
        "<span>🚪 Logout</span>": "<span>Logout</span>",
        "➕ Add Client": "Add Client",

        # Admin Sidebar & UI
        "<span>🤝 Partner</span>": "<span>Partner</span>",
        "<span>👥 Influencers</span>": "<span>Influencers</span>",
        "<span>📖 I Dictionary</span>": "<span>I Dictionary</span>",
        "<span>💲 I Fees</span>": "<span>I Fees</span>",
        "✏️ Update Rate": "Update Rate",

        # Partner Contact
        "📞 +971 4 399 2211": "+971 4 399 2211",
        "✉ contact@mohammadsaba.ae": "contact@mohammadsaba.ae",
        "📍 Business Bay, Dubai": "Business Bay, Dubai",
        "🚫 Inactive Account": "Inactive Account",
        "🗑️ Delete Account": "Delete Account",
        "✔ Active Account": "Active Account",
        "🔑 Change Password": "Change Password",

        # Card & Form Icons
        "👤 Full Name": "Full Name",
        "📞 Phone Number": "Phone Number",
        "✉ Email Address": "Email Address",
        "💼 Profession": "Profession",
        "📅 Age": "Age",
        "👥 Family Members": "Family Members",
        "📍 City": "City",
        "🏛️ State": "State",
        "👤 Influencer (Optional)": "Influencer (Optional)",

        # Other emojis
        "★ Shortlisted": "Shortlisted",
        "📷 ": "",
        "📍 ": "",
        "🛏️ ": "",
        "🛁 ": "",
        "📐 ": "",
        "👆 ": "",
        "👥 ": "",
        "📞 ": "",
        "✈️ ": "",
        "📄 ": "",
        "👛 ": "",
        "💰 ": "",
        "📜 ": "",
        "🪙 ": "",
        "💵 ": "",
        "💳 ": "",
        "💲 ": "",
        "🔗 ": "",
        "👤 ": "",
        "⭐ ": "",
        "❌ ": "",
        "✔ ": "",
        "✓ ": "",
        "✓": "",
        "✔": "",
        "✕": "&times;",
        "❚❚": "Pause",
        "▶": "Play",
        "⏭": "Next",
        "♥": "&#9825;"
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    # Clean any lingering unicode emojis
    emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\u2300-\u23ff]|[\u2b50-\u2b55]|[\u203c-\u2049]')
    content = emoji_pattern.sub('', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Cleaned {filepath}")

clean_file('public/index.html')
clean_file('public/future-elite.js')
