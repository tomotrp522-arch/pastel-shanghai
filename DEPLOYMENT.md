# GitHub Pagesへの公開手順

公開URL: **https://tomotrp522-arch.github.io/pastel-shanghai/**

対象リポジトリ: **tomotrp522-arch/pastel-shanghai** のみ。

## 現在の状態

- 回数制限・リタイア・手詰まり案内の更新を `main` にプッシュし、GitHub Actionsのbuild・deploy成功と公開URLのHTTP 200、新しいJavaScript・CSS・Service Workerの一致を確認済みです。

- ローカルはGit管理下で、公開対象ブランチは `main` です。接続先は `https://github.com/tomotrp522-arch/pastel-shanghai.git` です。
- ユーザーが作成した専用Publicリポジトリの存在をGitHub APIで確認しました。確認時点では空のリポジトリでした。別のリポジトリは操作しません。
- コミット作者には、このリポジトリ内でのみ `tomotrp522-arch` とGitHubの公開アカウントIDに基づくnoreplyメールを使用します。グローバルのGit設定は変更しません。
- **リポジトリへのアップロードとPagesでのサイト公開は別の処理です。** プッシュ結果はチャットの実行報告で確認し、サイトの公開完了はActionsの `deploy` 成功と公開URLで確認してください。
- ローカルのテスト22件とビルドは成功しています。Pagesのサブパスとキャッシュ分離は自動テストで確認しています。実際の公開URLでの実機動作は、公開後の確認が必要です。

## 1. ログインして対象リポジトリを確認する

1. 普段のブラウザで https://github.com/login を開き、**tomotrp522-arch** としてログインします。パスワード・認証コード・トークンをチャットに送る必要はありません。
2. https://github.com/tomotrp522-arch/pastel-shanghai を開きます。
3. リポジトリが表示される場合は、そのリポジトリだけを使います。既存のコミットがある場合は、内容確認・履歴取得後に統合します。強制プッシュはしません。
4. ログイン後も404の場合は、まだリポジトリがない、または現在のアカウントにアクセス権がない状態です。アカウントを確認し、必要なら次の手順で新規作成します。

## 2. 初回コミット・リポジトリ作成・アップロード

マウス操作中心で進める場合は、公式のGitHub Desktopを使用できます。

1. GitHub Desktopで **File → Options → Accounts → Sign in** からGitHub.comにログインします。アカウントは **tomotrp522-arch** を選びます。未導入の場合は https://desktop.github.com/ から入手してください。
2. **File → Add local repository → Choose…** で、現在の **pastel-shanghai** フォルダーを選び、**Add repository** をクリックします。別のゲームのフォルダーを選ばないでください。
3. 初回に名前・メールアドレスの設定を求められた場合は、GitHubの自分のコミット用設定を選びます。この作業では他の人の名前・メールは設定していません。
4. **Changes** に `.github/workflows/pages.yml`、`src`、`icons`、`scripts`、`test`、`index.html`、`manifest.webmanifest`、`sw.js` などが並んでいることを確認します。`dist`・`artifacts`・`.git` はアップロード対象にしません。
5. **Summary** に `Initial release of Pastel Shanghai` と入力し、**Commit to main** をクリックします。
6. 対象リポジトリが存在しない場合は **Publish repository** をクリックし、名前を **pastel-shanghai**、Ownerを **tomotrp522-arch** にします。無料プランでPagesを利用する場合は **Keep this code private** をオフにして公開リポジトリにし、確認後 **Publish repository** をクリックします。
7. 対象リポジトリが既に存在する場合は、新規作成ボタンで重複作成しません。既存履歴を確認してから接続・アップロードしてください。このチャットに「対象リポジトリが表示された」と知らせれば、既存履歴を壊さない手順を続けられます。

公開リポジトリにするとソースコードも公開されます。GitHub Pagesの無料枠の利用条件はGitHub公式の案内を確認してください。

CLIで進められる環境では、GitHub認証とコミット作者設定後に、このフォルダーだけで以下を実行できます。**対象リポジトリが新規・空であることを確認した場合の手順**です。

```sh
git add .
git commit -m "Initial release of Pastel Shanghai"
git remote add origin https://github.com/tomotrp522-arch/pastel-shanghai.git
git push -u origin main
```

## 3. Pagesを有効化する

1. 対象リポジトリの **Settings → Pages** を開きます。
2. **Build and deployment → Source** で **GitHub Actions** を選びます。
3. **Actions** タブを開きます。初回にワークフロー有効化の案内が出た場合は、このリポジトリのActionsを有効化します。
4. 左側の **Publish to GitHub Pages** をクリックします。
5. **Run workflow → Branch: main → Run workflow** をクリックします。初回プッシュ時の実行がPages未設定で失敗していても、設定後にこの操作で再実行できます。
6. `build` と `deploy` が両方とも緑のチェックになるまで待ちます。`github-pages` 環境で承認を要求された場合は、対象URLを確認して **Review deployments → Approve and deploy** を選びます。
7. 成功後、Settings → Pages の **Visit site**、または上記の公開予定URLを開きます。

Settings → Pagesがない、Sourceを選べない、権限不足と表示される場合は、**tomotrp522-arch/pastel-shanghaiの管理者・メンテナー権限**が必要です。別リポジトリの設定は変更しません。

## 4. 2回目以降の自動公開

`main` にコミットをプッシュすると、自動で次の順に処理します。

1. Node.js 24で `node --test`
2. `node scripts/build.mjs`
3. `dist/` のみをPages用アーティファクトへアップロード
4. GitHub標準の短期トークンでPagesへデプロイ

テストやビルドが失敗すればデプロイしません。対象リポジトリ・`main` の条件をワークフローに設定し、他リポジトリや別ブランチではデプロイジョブが実行されません。個人用トークンをソースに埋め込む必要はありません。

## 5. スマートフォン・PWAの確認

1. スマホで https://tomotrp522-arch.github.io/pastel-shanghai/ を開きます。末尾の `/` を含むURLです。
2. 牌の表示・音声・ヒント・シャッフルを確認し、一度ページを再読み込みして保存から再開します。
3. iPhoneはSafariの **共有 → ホーム画面に追加**、Androidは対応ブラウザの **アプリをインストール／ホーム画面に追加** を使います。
4. 初回の読み込みが完了してから機内モードにし、再起動してオフラインプレイを確認します。

Service Worker、CSS、JavaScript、画像、manifestは相対URLで参照します。PWAの開始URL・スコープ・IDは `/pastel-shanghai/` 内に解決されます。キャッシュ名にもスコープのパスを入れ、同じ `github.io` 上にある別ゲームのキャッシュを削除しません。

ゲームのデザイン・ルール・BGM・セーブ形式は変更していません。保存先は従来どおり端末・ブラウザ・オリジン単位のlocalStorageです。**localhostの記録と公開URLの記録は別の保存領域**なので、既存ローカル記録は公開URLへ自動移行されません。

更新時は `sw.js` のキャッシュバージョンを変更します。新キャッシュを準備した後、再読み込みで新しいファイルが反映されます。

## 公式資料

- [GitHub Pagesの公開元設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub ActionsでPagesを公開する](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Desktop](https://desktop.github.com/)
