Abratecnica - Deploy ZIP helper

Files created:
- create_deploy_zip.ps1  => PowerShell script that packages only the files needed for deployment into abratecnica_deploy.zip

How to use (Windows PowerShell):
1) Open PowerShell and navigate to the project root folder (where index.html and create_deploy_zip.ps1 are):
   cd 'C:\Users\Lenovo\OneDrive\Escritorio\web abratecnica'

2) Run the script:
   .\create_deploy_zip.ps1

3) After completion you will have: abratecnica_deploy.zip in the same folder.
   Upload that ZIP with FileZilla (or extract locally and upload the extracted files) into the remote folder (usually /public_html/ or /www/).

Notes:
- The script excludes development-only files (node_modules, .git, image-proxy.py, local scripts) and includes the common static assets and API PHP files if they exist.
- If you need to include/remove specific files, open create_deploy_zip.ps1 and edit the $paths array or the $folders list.
- If your hosting requires PHP files to be placed in a specific folder, move the files after upload or modify the remote path in FileZilla accordingly.

Need help customizing the ZIP (e.g., add more files or exclude some)? Tell me which files to include/exclude and I will update the script.