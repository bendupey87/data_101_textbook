@echo off
setlocal

:: 1. Clone repo to temp folder
set TEMP_DIR=deploy_temp
rmdir /s /q %TEMP_DIR% 2>nul
git clone https://github.com/bendupey87/data_101_textbook.git %TEMP_DIR%
cd %TEMP_DIR%

:: 2. Clean & build book
jupyter-book clean book/ --all
jupyter-book build book/
python remove_search.py

:: 3. Create gh-pages branch if needed
git checkout gh-pages 2>nul || git checkout --orphan gh-pages

:: 4. Remove all existing content in gh-pages branch
git rm -rf . 2>nul

:: 5. Copy built site to root of gh-pages
xcopy /E /I /Y book\_build\html\* .

:: 6. Commit and push
git add .
git commit -m "Deploy Jupyter Book" || echo "Nothing to commit"
git push origin gh-pages --force

:: 7. Cleanup
cd ..
rmdir /s /q %TEMP_DIR%

echo ✅ Deployment complete! Go to:
echo   https://bendupey87.github.io/data_101_textbook

pause
