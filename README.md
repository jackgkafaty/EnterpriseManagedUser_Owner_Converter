# GitHub Enterprise Owner Management Tool

A web application for managing GitHub Enterprise Owner roles. Connect to your GitHub Enterprise instance and assign or remove Enterprise Owner privileges from users.

## What does this tool do?

This tool connects to GitHub Enterprise accounts and allows you to:
- View all users in your enterprise
- See who currently has Enterprise Owner privileges  
- Assign Enterprise Owner role to users
- Remove Enterprise Owner role from users
- Search and filter users by name, email, or role

## Security features

- **AES-256 encryption**: All credentials are encrypted before local storage
- **Local storage only**: Credentials never leave your browser
- **No server required**: Runs entirely in your browser
- **Token-based auth**: Uses GitHub Personal Access Tokens (no passwords)
- **Automatic logout**: Clears credentials when you close the app

## Build instructions

```bash
# Clone the repository
git clone https://github.com/jackgkafaty/EnterpriseManagedUser_Owner_Converter.git
cd EnterpriseManagedUser_Owner_Converter

# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build
```

## APIs used

- **GitHub SCIM v2 API**: For Enterprise Managed Users (EMU)
- **GitHub REST API**: For regular GitHub Enterprise instances
- **GitHub GraphQL API**: Fallback for enterprise member management

## Required token permissions

Your Personal Access Token needs these scopes:

**For Enterprise Managed Users (EMU):**
- `scim:enterprise` - Required for user and role management

**For regular GitHub Enterprise:**
- `admin:enterprise` - Required for enterprise administration
- `read:enterprise` - For reading enterprise information

## Project structure

```
src/
├── components/
│   ├── LoginForm.tsx          # Enterprise login form
│   ├── Header.tsx             # App header with logout
│   ├── UserManagement.tsx     # Main user interface
│   ├── UserCard.tsx           # Individual user cards
│   └── DisclaimerBanner.tsx   # Legal disclaimer
├── services/
│   ├── githubApi.ts           # GitHub API client
│   ├── useGitHubAuth.ts       # Authentication hook
│   └── encryption.ts          # Credential encryption
├── utils/
│   └── security.ts            # Security utilities
└── App.tsx                    # Main application

## How to use

1. **Get a Personal Access Token**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Create a new token with the required scopes listed above

2. **Launch the application**
   - Open the tool in your browser
   - Enter your enterprise name (the slug, like "acme-corp")
   - Paste your Personal Access Token
   - Click "Connect to Enterprise"

3. **Manage users**
   - Browse all users in your enterprise
   - Use the search box to find specific users
   - Click "Assign Enterprise Owner" to give someone owner privileges
   - Click "Remove Enterprise Owner" to revoke owner privileges
   - Changes take effect immediately
   - Changes take effect immediately

## Troubleshooting

**Authentication fails:**
- Check your enterprise name is correct (use the slug, not full name)
- Verify your token has the right scopes
- Make sure you're an Enterprise Owner yourself

**Can't see users:**
- EMU enterprises: Need `scim:enterprise` scope
- Regular enterprises: Need `admin:enterprise` scope

**Role changes don't work:**
- Check network connectivity
- Verify the user exists in your enterprise
- Some users may be managed by your identity provider

## Contributing

1. Fork this repository
2. Make your changes
3. Test with your enterprise
4. Submit a pull request
