# 🚀 Quick Commands to Push to GitHub

## Option 1: Automated Script (Easiest!) ⭐

```bash
bash push-to-github.sh
```

**This handles everything automatically!**

---

## Option 2: Manual Commands (Copy & Paste)

```bash
# Step 1: Initialize git
git init

# Step 2: Configure user (replace with your details)
git config user.name "Yogeshalbiorix"
git config user.email "your-email@example.com"

# Step 3: Add remote
git remote add origin https://github.com/Yogeshalbiorix/Yogeshalbiorix.git

# Step 4: Stage and commit
git add .
git commit -m "feat: Complete HRMS Application with Database Setup"

# Step 5: Push to GitHub
git push -u origin main
```

---

## Authentication

When GitHub asks for password, use a **Personal Access Token**:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select: `repo` and `workflow` scopes
4. Copy the token
5. Use it as password when git prompts

---

## Verify Success

After pushing, visit:
https://github.com/Yogeshalbiorix/Yogeshalbiorix

You should see all your files! 🎉

---

## Troubleshooting

### "Repository not found"
```bash
git remote -v
git remote set-url origin https://github.com/Yogeshalbiorix/Yogeshalbiorix.git
```

### "Authentication failed"
Use Personal Access Token (not password)

### "Updates were rejected"
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

---

## Need More Help?

Read the detailed guide:
```bash
cat GITHUB_PUSH_GUIDE.md
```

Or just run the automated script:
```bash
bash push-to-github.sh
```

Good luck! 🚀
