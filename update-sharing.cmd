@echo off
chcp 65001 >nul
node "%~dp0update-sharing.cjs"
if errorlevel 1 (
  echo 更新できませんでした。Node.jsが入っているか、config.jsの記述を確認してください。
  pause
  exit /b 1
)
echo index.htmlとgame.htmlを更新しました。変更したファイルを公開先へアップロードしてください。
pause
