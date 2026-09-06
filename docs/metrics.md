# 計測表

各段階終了直後に埋める。両トラックで同じ定義を使う。

定義:
- ターン数: 依頼を投げてから完了報告までの、人の発話回数(初回依頼を含む)。
- 手戻り: 完了報告後に人が指摘して修正した回数。
- 生成ファイル数/行数: `git show --stat` の数値(node_modules, lock, .next を除く)。
- diff 行数: `git diff --shortstat <前段階タグ> <今段階タグ> -- <トラックのディレクトリ>`(追加+削除)。
- 仕様ファイル: cc-sdd のみ。requirements/design/tasks が今段階で更新されたか。
- テスト: 追加したテスト数と最終結果。
- 経過時間: 依頼から完了報告まで(分)。

## prompt-first

| 段階 | ターン数 | 手戻り | 生成/変更ファイル数 | diff 行数(+/-) | テスト(追加/合計/結果) | 経過時間 | 備考 |
|---|---|---|---|---|---|---|---|
| step1 initial | 1 | 0 | 21 (src/db/tests: 15) | +470 / -128 (src/db/tests: +426 / -105) | 6 / 6 / pass | 4分 (19:01-19:04) | scaffold(step0)は別コミット。完了前に自己修正3件: ダークモードCSS、lint警告、vitest設定拡張子。暗黙の決定: シード投入タイミング(起動時・空のときのみ)、検索のLIKEエスケープ、削除確認はwindow.confirm、/ を /products にリダイレクト |
| step2 sort | 1 | 0 | 5 (新規1: sort-header.tsx) | +133 / -14 | 5 / 11 / pass | 1分 (19:05-19:06) | 暗黙の決定: listProducts のシグネチャ変更(文字列→オプション型、後方互換維持)、ソート列はホワイトリスト検証、同値時は id で安定ソート、検索フォームが sort/order を hidden で維持、aria-sort 付与 |
| step3 edit-modal | 1 | 0 | 5 (新規1: edit-product-modal.tsx) | +314 / -5 | 4 / 15 / pass | 3分 (19:06-19:09) | 完了前に自己修正1件: React 19 がアクション後にフォームをリセットし、バリデーション失敗時に入力値が消えた → 制御コンポーネント化。暗黙の決定: ネイティブ dialog を使用、useActionState + version カウンタで成功検知、price は type=text + inputMode=numeric(ブラウザ検証を避けサーバ側で統一)、note 空は null 保存 |
| step4 bookmark | 1 | 0 | 10 (新規2: 002 migration, bookmark-toggle.tsx) | +138 / -27 | 3 / 18 / pass | 3分 (19:09-19:12) | 暗黙の決定: products 列に bookmarked フラグ追加(別テーブルにしない)、トグルはフォーム+サーバアクション(JS 不要)、既存 SortHeader の引数を keyword→preserved に変更(既存コード改変)、行ハイライト色、詳細に bookmarked 行を追加表示 |
| step5 auth | 1 | 0 | 17 (新規11: 003 migration, auth.ts, session.ts, return-to.ts, proxy.ts, login/actions.ts, login/page.tsx, login-form.tsx, app-header.tsx, auth.test.ts, return-to.test.ts) | +437 / -5 | 9 / 27 / pass | 6分 (19:23-19:29) | **ルール変更あり**: CLAUDE.md の「認証なし」を改訂。完了前に自己修正1件: "use server" ファイルから同期関数(safeReturnTo)を export して build エラー → 別ファイルへ分離。暗黙の決定: セッションは DB テーブル(署名 Cookie ではない)、scrypt のフォーマット、proxy は Cookie 有無の楽観チェックのみで DB 照合は各ページ/アクション、ユーザー不在時もハッシュ計算して所要時間を揃える、returnTo は内部パスのみ許可、既存3アクション全てに requireUser 追加 |
| step6 authz | 1 | 0 | 11 (新規4: 004 migration, authz.ts, forbidden/page.tsx, authz.test.ts) | +191 / -30 | 17 / 44 / pass | 4分 (19:29-19:33) | 暗黙の決定: 権限は文字列(product:edit 等)でロール→権限の表を持つ、ロールは users の列(別テーブルにしない)、拒否時の挙動は void アクションは /forbidden へリダイレクト・状態を返すアクションはメッセージ、viewer にはブックマークを操作不可の静的表示、既存 BookmarkToggle に canToggle 引数追加(既存コード改変) |

## cc-sdd

cc-sdd 側の追加定義(`cc-sdd/docs/metrics.md` より):

- ターン数: 依頼を投げてから完了報告までの、人の発話回数(初回依頼を含む。spec 各フェーズの承認発話を含む)。
- 手戻り: 完了報告後に人が指摘して修正した回数。
- 生成ファイル数/行数: `git show --stat` の数値(node_modules, lock, .next を除く)。
- diff 行数: `git diff --shortstat <前段階タグ> <今段階タグ>`(追加+削除)。`.kiro/` を含む値と除いた値を併記する。
- 仕様ファイル: requirements/design/tasks が今段階で更新されたか。既存 spec や steering に手が入ったかも記す。
- テスト: 追加したテスト数と最終結果。
- 経過時間: フェーズごと(requirements / design / tasks / impl)と合計(分)。

| 段階 | ターン数 | 手戻り | 生成/変更ファイル数 | diff 行数(+/-) | 仕様ファイル更新 | テスト(追加/合計/結果) | 経過時間 | 備考 |
|---|---|---|---|---|---|---|---|---|
| step1 initial | 4 | 0 | 28 (.kiro 除く 23、src/db/tests 17) | +1382 / -134 (.kiro 除く +699 / -134、src/db/tests +644 / -110) | 新規: requirements / research / design / tasks(計 683 行)。実装中に design.md を 1 か所更新(time.ts 追加) | 20 / 20 / pass | 17分 (22:57-23:14)。内訳: requirements 2分、design 6分、tasks 2分、impl 6分 | ターン内訳: 依頼 1 + 承認 3(requirements / design / tasks)。完了前の自己修正 2 件: lint エラー(`<a>` → `Link`)、Turbopack のファイルトレース警告(`turbopackIgnore` コメント)。要件で明文化した判断: 既定順 code 昇順、0 件表示、`/` → `/products`、英字大小無視、`%`・`_` は通常文字、空白検索は全件、非数値 id は 404、note 空表示、削除取り消しは詳細に留まる、不在削除は一覧へ、シードは 0 件時のみ 20 件、機能ごとのテスト。設計で明文化した判断: DB 初期化は初回アクセス時に冪等実行、`redirects()` で誘導、検索は GET フォーム、削除は Server Action + `window.confirm`、`LIKE ... ESCAPE`、時刻はアプリ側で ISO8601、テスト DB は `DATABASE_PATH`、ライトテーマのみ、`schema_migrations` はコード側で作成。設計と実装の乖離: 循環 import 回避のため `time.ts` を追加(design.md に追記)。動作確認は Claude in Chrome。削除の確認ダイアログは拡張をブロックするため `window.confirm` を差し替えて取り消し/承認の両方を検証 |
| step2 sort | 4 | 0 | 12 (.kiro 除く 7、新規 3: sort-header.tsx, list-url.ts, list-url.test.ts) | +691 / -17 (.kiro 除く +234 / -17) | 新規: product-sort の requirements / research / design / tasks(計 457 行)。product-master の spec は未変更 | 16 / 36 / pass | 8分 (23:17-23:25)。内訳: requirements 1分未満、design 3分、tasks 1分、impl 3分 | ターン内訳: 依頼 1 + 承認 3。完了前の自己修正 0 件。既存コード改変 3 ファイル: products.ts(ORDER BY 可変化 + 型)、page.tsx(th 置き換え・クエリ読み取り)、search-form.tsx(props に sort 追加、hidden input)。prompt-first と同じ 3 か所。要件で明文化した判断: 別列クリックは昇順から・同列は反転、price は数値順・他は文字列順、同値は id 昇順、JS 無効でも動く、ソート中の列のみ印 + aria-sort、検索時にソート保持・ソート切替時に検索語保持、不正 sort は既定・不正 order は昇順・order 省略は昇順、既定時は code に昇順の印。設計で明文化した判断: 解釈と URL 組み立てを純粋関数に集約、ヘッダ URL は常に sort/order を明示、検索フォームは hidden input(GET は action のクエリを捨てる)、文字列列は BINARY 照合のまま(Open Question として記録)、列名はホワイトリスト経由のみ SQL に埋め込む。設計と実装の乖離: なし。動作確認は Claude in Chrome(ヘッダクリック → 反転 → 検索でソート保持 → 別列でも検索語保持)+ curl(不正値のフォールバック、hidden input、href) |
| step3 edit-modal | 4 | 0 | 12 (.kiro 除く 7、新規 3: edit-product-modal.tsx, product-input.ts, product-input.test.ts) | +815 / -2 (.kiro 除く +322 / -2) | 新規: product-edit の requirements / research / design / tasks(計 493 行)。実装中に design.md を 1 か所更新(dialog の close はネイティブ購読) | 9 / 45 / pass | 10分 (23:26-23:36)。内訳: requirements 1分未満、design 3分、tasks 1分、impl 5分 | ターン内訳: 依頼 1 + 承認 3。完了前の自己修正 2 件: (1) 自作テストの期待値誤り(降順配列の添字)、(2) React が `<dialog>` の `onClose` を配信せず Esc 後に入力状態が戻らない → ブラウザ確認で発見、`useEffect` でネイティブ `close` を購読。既存コード改変 3 ファイル(actions.ts、products.ts、[id]/page.tsx)、いずれも追加のみ。prompt-first で自己修正だった「React 19 の action 後フォームリセットで入力値が消える」は、要件 2.5 と design(制御コンポーネント)で事前に扱われ、実装での手戻りなし。要件で明文化した判断: trim して必須判定、price の不正パターン列挙、複数エラー同時表示、エラー時の入力保持、サーバ側検証、note 空は未設定、リロードなしで詳細更新、不変列、削除済みの扱い、二重送信防止、Esc = キャンセル、再表示は保存済み値。設計で明文化した判断: ネイティブ dialog、検証は純粋関数、制御コンポーネント、price は text + inputMode、redirect せず revalidatePath + 成功状態、UPDATE の影響行数で不在判定。動作確認は Claude in Chrome(エラー 2 件同時表示と入力保持 → 保存でモーダル閉鎖・詳細と updated_at 更新 → 一覧に反映 → キャンセル / Esc で復元) |
| step4 bookmark | 4 | 0 | 18 (.kiro 除く 13、新規 3: 002 migration, bookmark-toggle.tsx, bookmark-filter-toggle.tsx) | +784 / -40 (.kiro 除く +301 / -40) | 新規: product-bookmark の requirements / research / design / tasks(計 483 行)。他 spec は未変更 | 11 / 56 / pass | 作業時間 約10分(requirements 1分未満 23:37、design 約3分 〜07:00、tasks 1分 07:03、impl 5分 07:05-07:10)。requirements 承認は翌朝のため待ち時間は除外 | ターン内訳: 依頼 1 + 承認 3。完了前の自己修正 1 件: 自作テストの準備不足(DB ディレクトリ未作成 + require import が lint 違反)。加えて検証手順のミス 1 件: curl で Server Action を直接叩く際に詳細ページ最初の form(削除)の ACTION_ID を拾い、シード 1 件を消した(アプリの挙動は正しい。returnTo を含む form に限定して再実行)。既存コード改変 7 ファイル + 既存テスト 1 ファイル(products.ts、list-url.ts、sort-header.tsx、search-form.tsx、products/page.tsx、[id]/page.tsx、actions.ts、db.test.ts)。design.md の Modified Files に全て事前列挙。prompt-first と同じく SortHeader / SearchForm の引数が増えた。要件で明文化した判断: 操作後は同じ画面(q / sort / bookmarked 保持)、JS 不要、不在は一覧へ、既存行は OFF、updated_at 不変、削除で消える、`1` 以外は無効、3 条件の相互保持、フィルタ中に OFF で行が消える、0 件メッセージ、行強調 + トグル見た目 + 詳細表示、aria-pressed。設計で明文化した判断: products にフラグ列(別テーブル不採用)、フォーム + Server Action + redirect、hidden に次の状態(冪等)、returnTo は safeReturnTo で内部パスに限定、行 → Product 変換を 1 か所に集約、フィルタはリンク。設計と実装の乖離: なし。動作確認は Claude in Chrome(☆→★ で行強調・URL 同じ → フィルタ ON → 検索でフィルタ維持 → フィルタ中に ★ を外すと行が消え 0 件メッセージ)+ curl(JS なし POST、外部 returnTo の拒否、不在 id、不正 bookmarked 値、hidden と href の 3 条件保持) |
| step5 auth | 4 | 0 | 28 (.kiro 除く 20、新規 14: 003 migration, login/actions.ts, login/page.tsx, app-header.tsx, login-form.tsx, auth.ts, password.ts, session.ts, users.ts, proxy.ts, password/session/users.test.ts) | +1192 / -25 (.kiro 除く +568 / -23) | 新規: auth-login の requirements / research / design / tasks(計 620 行)。**steering 改訂**: rules.md(認証なし → 依頼があった段階で追加)、tech.md(同期)、structure.md(lib/auth.ts の例外)。既存 spec の「認証なし」は当時の前提として残し、新 spec の Introduction で上書きを宣言。実装中に design.md の Open Question を判定済みに更新 | 15 / 71 / pass | 作業時間 約11分(ルール改訂 + spec-init + requirements 1分 07:19-07:20、design 4分 07:21-07:24、tasks 1分 07:32、impl 5分 07:36-07:41) | **ルール変更あり**(prompt-first と同じ文言、依頼前に別コミット)。ターン内訳: 依頼 1 + 承認 3。完了前の自己修正 0 件。検証手順の学び: useActionState のフォームは hidden が `$ACTION_REF_1` / `$ACTION_1:0` / `$ACTION_KEY` 形式で、Server Component のフォーム(`$ACTION_ID_`)と異なる。フォームの hidden を全て再送するスクリプト(form-post.mjs)で JS なし送信を再現。design の Open Question(JS なしでエラーが描画されるか)は「描画される(HTTP 200、username 保持)」と判定し代替案は不要。ブラウザ確認はログイン画面の表示と未ログイン時の returnTo 付きリダイレクトまで。パスワードはブラウザに入力しない方針のため、ログイン後のヘッダは curl の HTML で確認(拡張の制約で JS からの Cookie 注入も不可)。既存コード改変 6 ファイル + 既存テスト 1(layout.tsx、products/page.tsx、[id]/page.tsx、actions.ts、db.ts、README、db.test.ts)。prompt-first と同じ箇所。要件で明文化した判断(38 基準): 失敗は空欄含め同一メッセージ、username 保持 / password 非保持、ログイン済みで /login は /products、所要時間の均一化、復帰先は内部パスのみ、Cookie は HttpOnly + SameSite=Lax + Path=/、24h 固定・延長なし、期限切れ・偽造は未ログイン、毎回サーバ検証、128 ビット以上の ID、複数セッション可、Server Action も保護、/login と静的は素通し、ログアウトはサーバ側破棄 + Cookie 無効化、ソルト付き一方向ハッシュ、users 0 件時のみシード、username 一意、新番号 migration。設計で明文化した判断: DB セッション(署名 Cookie 不採用)、Proxy は楽観 + requireUser で DB 照合、scrypt の自己記述形式、ダミーハッシュ、randomBytes(32)、safeReturnTo 再利用、Secure なし(Open)、lib/auth.ts だけ Next 依存、react cache で 1 リクエスト 1 照合。設計と実装の乖離: なし |
| step6 authz | 4 | 0 | 19 (.kiro 除く 14、新規 4: 004 migration, authz.ts, forbidden/page.tsx, authz.test.ts) | +675 / -28 (.kiro 除く +198 / -28) | 新規: authz-roles の requirements / research / design / tasks(計 455 行)。他 spec・steering は未変更 | 15 / 86 / pass | 作業時間 約10分(spec-init + requirements 1分未満 07:48、design 3分 07:50-07:52、tasks 1分 07:55、impl + 検証 5分 07:57-08:02) | ターン内訳: 依頼 1 + 承認 3。完了前の自己修正 0 件。検証手順のミス 1 件(再発): 検証スクリプトの試し打ちが admin の Cookie で本当に削除を実行し、以降の偽装確認が対象不在で失敗 → DB を作り直して再実行(アプリの挙動は正しい)。既存コード改変 7 ファイル + 既存テスト 2(users.ts、auth.ts、actions.ts、[id]/page.tsx、products/page.tsx、app-header.tsx、bookmark-toggle.tsx、users.test.ts、db.test.ts)。prompt-first と同じく BookmarkToggle に canToggle が増えた。要件で明文化した判断: 3 値以外は保存不可・解釈は viewer、既存ユーザーへの適用は migration、権限は列挙した操作に限る・表は 1 か所、viewer には印だけ残す、拒否の応答は遷移型(/forbidden)と状態型(formError)で分ける、検査はログイン後・変更前、セッション由来のロールのみ、偽装要求での確認を完了条件に含める。設計で明文化した判断: 操作名文字列の権限表(序列比較・直接比較は不採用)、forbidden() は experimental のため通常ページ、ADD COLUMN + CHECK + UPDATE の 2 文、viewer 用の印は既存部品の props。設計と実装の乖離: なし。検証: 3 ロールの詳細 / 一覧 HTML でボタン・フォームの有無とヘッダのロール、admin の HTML から取ったフォームを viewer / editor / 未ログインの Cookie で送信(削除・トグルは /forbidden、更新は formError、editor の許可操作と admin の削除は成功、未ログインは /login)。ブラウザは未使用(ログイン後の画面は Cookie 注入不可のため curl で代替) |

## cc-sdd 所感(セッション内で記録)

- step1: 依頼文 1 本に対し、仕様 3 フェーズ(requirements / design / tasks)で人の承認 3 回を挟んだ。承認は全て一言("OK")で、修正指示はなし。
- prompt-first で「暗黙の決定」だった項目のうち、requirements に 12 件、design に 9 件が文言として現れた(上表 備考)。人が承認時に読む量は requirements 90 行、design 382 行、tasks 86 行。
- cc-sdd のコマンド版(`--claude-code`)は v3.0.2 で非推奨表示(`--claude-skills` を推奨)。またセッション開始後に追加された `/kiro:*` はこのセッションからスラッシュコマンドとして呼べず、コマンドファイルの指示を読んで手で実行した。
- discovery では Web 検索をせず、AGENTS.md の指示どおり `node_modules/next/dist/docs/` を読んだ。research.md に出典として記録。
- 実装は tasks.md の順に TDD(テスト先行)で進め、タスクごとにコミット。UI(3.1〜4.1)はテストなし(design の Testing Strategy で手動 E2E と定義)。
- 実装中の設計変更は 1 件(`time.ts`)。design.md に追記して整合を保った。
- step2: 拡張なので discovery は light(既存 3 ファイルの分析のみ)。仕様 3 本で 457 行に対し、コード差分は +234 / -17。既存コードの改変箇所は prompt-first と同じ 3 ファイルで、design.md の Modified Files に事前に列挙されていた。自己修正 0 件。
- step2: cc-sdd では「別の spec(product-master)の関数シグネチャを拡張する」ことを Boundary Context / Allowed Dependencies に書く必要があり、その分 requirements/design が長くなる。prompt-first ではこの判断は listProducts の変更としてコードにだけ現れた。
- step3: prompt-first で「ハーネスをすり抜けた問題」(フォーム入力値の保持)に相当する挙動は、requirements 2.5 として明文化され、design で制御コンポーネントを選んだため実装で再発しなかった。一方で dialog の `onClose` が React で動かない問題は design にも現れず、ブラウザ確認で初めて見つかった(仕様は「Esc でキャンセルと同じ動作」を要求していたので、確認項目としては仕様から導けた)。
- step3: ユニットテストは検証関数とリポジトリに集中し、UI(モーダル)はテストなし。自己修正 2 件のうち 1 件は UI 側で、テストでは捕まえられない種類。
- step4: 既存 spec 2 本(product-master、product-sort)にまたがる拡張。design の Modified Files に 7 ファイル + 既存テスト 1 件を事前に列挙でき、実装はそのとおりに進んだ。prompt-first では同じ改変(SortHeader / SearchForm の引数)が「依頼文に現れない波及」として事後に記録された。
- step4: 検証手順で Server Action の ID を取り違えて削除を実行した。アプリの欠陥ではないが、「フォーム偽装」の検証を curl で行うときは form 単位で ID を取る必要がある(step5/6 の権限検査の確認でも同じ手順を使う)。
- step4 終了時の規模: src + db + tests で 1,456 行、テスト 56 件(prompt-first の step4 終了時は 1,011 行、テスト 18 件)。
- step5: 前提変更(認証なし → あり)は steering 3 ファイルの改訂コミットとして残り、旧 spec は書き換えず新 spec の Introduction で上書きを宣言した。prompt-first では CLAUDE.md の 1 行差し替えとコミットメッセージだけが痕跡。cc-sdd では「なぜ変えたか」が steering(tech.md の改訂日付)と spec(Introduction)の 2 か所に残る。
- step5: 認証は要件 38 基準・design 313 行と最大になった。prompt-first の暗黙の決定 6 件(DB セッション、scrypt 形式、Proxy は楽観のみ、ダミーハッシュ、returnTo 内部限定、既存 action への requireUser)は全て design に事前に現れ、実装での自己修正は 0 件。prompt-first では "use server" ファイルからの同期関数 export で build エラーになる自己修正があったが、cc-sdd 側は safeReturnTo が既に list-url.ts(純粋モジュール)にあったため発生しなかった。
- step5: 設計の Open Question を 1 件持ち越し、実装時の curl で判定して design に追記した。「分からないことを分からないまま設計に書く」運用が回った例。
- step5 終了時の規模: src + db + tests で 1,985 行、テスト 71 件。
- step6: 権限表を 12 通りの表テストで固定した。prompt-first の暗黙の決定 5 件(文字列権限 + ロール表、role は users の列、拒否時の遷移 / メッセージの分岐、viewer は静的表示、BookmarkToggle の引数追加)は全て requirements か design に事前に現れた。実装での自己修正 0 件。
- step6: 検証手順のミス(試し打ちで削除実行)が step4 に続き 2 回目。curl でフォーム偽装を確認する手順は「フォーム単位で ID を取る」「送信前に dry-run と本番を分ける」の 2 点を守らないと DB を壊す。cc-sdd の完了条件(要件 6.2)は「偽装要求で確認する」ことを求めるが、その確認手順自体の安全性は仕様に書いていなかった。
- step6 終了時の規模: src + db + tests で 2,143 行、テスト 86 件(prompt-first の step6 終了時は 1,579 行、テスト 44 件)。仕様(requirements / design / tasks / research)は 6 spec で 3,082 行。

## 全段階のまとめ(cc-sdd)

| 段階 | ターン | 作業時間 | diff(.kiro 除く) | 仕様行数 | テスト追加 | 自己修正 | 既存コード改変 |
|---|---|---|---|---|---|---|---|
| step1 | 4 | 17分 | +699 / -134 | 683 | 20 | 2 | - |
| step2 | 4 | 8分 | +234 / -17 | 457 | 16 | 0 | 3 |
| step3 | 4 | 10分 | +322 / -2 | 493 | 9 | 2 | 3 |
| step4 | 4 | 約10分 | +301 / -40 | 483 | 11 | 1 | 7 + テスト 1 |
| step5 | 4 | 約11分 | +568 / -23 | 620 + steering 3 | 15 | 0 | 6 + テスト 1 |
| step6 | 4 | 約10分 | +198 / -28 | 455 | 15 | 0 | 7 + テスト 2 |
| 合計 | 24 | 約66分 | +2322 / -244 | 3,191 | 86 | 5 | - |

prompt-first(参考): 6 段階 合計 6 ターン、21 分、+1683 / -209、テスト 44、自己修正 5(step1: 3、step3: 1、step5: 1)。

- 自己修正の内訳(cc-sdd): テストコード側 3 件(step3 期待値、step4 準備、step1 は lint と Turbopack 警告)、UI 側 1 件(step3 dialog の onClose)、合計 5 件で prompt-first と同数。ただし内容は異なり、prompt-first の 5 件のうち 3 件(ダークモード CSS、React 19 のフォームリセット、"use server" からの同期関数 export)は cc-sdd では要件・設計で事前に扱われて発生しなかった。
- ハーネスをすり抜けた問題(完了報告後に人が見つけた欠陥): cc-sdd 側は現時点で 0 件(prompt-first は 2 件)。ただし人の承認は全て一言で、仕様のレビューは実質していない。
- 検証手順のミス(アプリではなく確認作業の誤り)は cc-sdd 側で 2 件(step4、step6)。どちらも curl で Server Action を直接叩く際の取り違え。


## prompt-first 所感(セッション内で記録)

- 全4段階とも依頼文1本で完了報告まで到達し、人の手戻りは 0。ただし完了前の自己修正が計4件(step1: 3件、step3: 1件)。
- 「仕様書」に相当するものは存在しない。判断の根拠はコード内コメントとコミットメッセージにのみ残る。
- 各段階で依頼文に書かれていない判断(上表「暗黙の決定」)を実装者が下している。SDD 側では requirements/design にこれらが明文化されるかが比較ポイント。
- 機能追加時に既存コードへ触った箇所: step2 で listProducts のシグネチャ、step4 で SortHeader と SearchForm の引数。依頼文には現れない波及。
- step4 終了時の規模: src + db + tests で 1,011 行、テスト 18 件。step6 終了時: 1,579 行、テスト 44 件。
- step5 は依頼が既存ルール(認証なし)と矛盾したため、依頼前にルールファイルを改訂した。prompt-first では改訂が CLAUDE.md の1行差し替えで済む一方、その判断の経緯はコミットメッセージにしか残らない。
- step5/6 の動作確認では、ブラウザでのパスワード入力を避けるため、サーバアクションを curl で直接呼ぶ方法(Next-Action ヘッダ + multipart)を使った。フォーム偽装での権限検査の確認にもそのまま使えた。
- 経過時間は「依頼文を受けてからコミットまで」で、ブラウザでの動作確認を含む。

## 定性比較(全段階終了後)

- 仕様と実装の乖離が起きた箇所
- 依頼文に書いていない判断をどこで誰が下したか(暗黙の決定の数)
- 機能追加時に既存コードのどこを読む必要があったか
- レビュー負担(人が読んだ行数の感覚値)
