# 計測表(cc-sdd トラック)

sdd01 の `docs/metrics.md` と同じ定義。取り込み時にマージする。

定義:
- ターン数: 依頼を投げてから完了報告までの、人の発話回数(初回依頼を含む。spec 各フェーズの承認発話を含む)。
- 手戻り: 完了報告後に人が指摘して修正した回数。
- 生成ファイル数/行数: `git show --stat` の数値(node_modules, lock, .next を除く)。
- diff 行数: `git diff --shortstat <前段階タグ> <今段階タグ>`(追加+削除)。`.kiro/` を含む値と除いた値を併記する。
- 仕様ファイル: requirements/design/tasks が今段階で更新されたか。既存 spec や steering に手が入ったかも記す。
- テスト: 追加したテスト数と最終結果。
- 経過時間: フェーズごと(requirements / design / tasks / impl)と合計(分)。

## cc-sdd

| 段階 | ターン数 | 手戻り | 生成/変更ファイル数 | diff 行数(+/-) | 仕様ファイル更新 | テスト(追加/合計/結果) | 経過時間 | 備考 |
|---|---|---|---|---|---|---|---|---|
| step1 initial | 4 | 0 | 28 (.kiro 除く 23、src/db/tests 17) | +1382 / -134 (.kiro 除く +699 / -134、src/db/tests +644 / -110) | 新規: requirements / research / design / tasks(計 683 行)。実装中に design.md を 1 か所更新(time.ts 追加) | 20 / 20 / pass | 17分 (22:57-23:14)。内訳: requirements 2分、design 6分、tasks 2分、impl 6分 | ターン内訳: 依頼 1 + 承認 3(requirements / design / tasks)。完了前の自己修正 2 件: lint エラー(`<a>` → `Link`)、Turbopack のファイルトレース警告(`turbopackIgnore` コメント)。要件で明文化した判断: 既定順 code 昇順、0 件表示、`/` → `/products`、英字大小無視、`%`・`_` は通常文字、空白検索は全件、非数値 id は 404、note 空表示、削除取り消しは詳細に留まる、不在削除は一覧へ、シードは 0 件時のみ 20 件、機能ごとのテスト。設計で明文化した判断: DB 初期化は初回アクセス時に冪等実行、`redirects()` で誘導、検索は GET フォーム、削除は Server Action + `window.confirm`、`LIKE ... ESCAPE`、時刻はアプリ側で ISO8601、テスト DB は `DATABASE_PATH`、ライトテーマのみ、`schema_migrations` はコード側で作成。設計と実装の乖離: 循環 import 回避のため `time.ts` を追加(design.md に追記)。動作確認は Claude in Chrome。削除の確認ダイアログは拡張をブロックするため `window.confirm` を差し替えて取り消し/承認の両方を検証 |
| step2 sort | 4 | 0 | 12 (.kiro 除く 7、新規 3: sort-header.tsx, list-url.ts, list-url.test.ts) | +691 / -17 (.kiro 除く +234 / -17) | 新規: product-sort の requirements / research / design / tasks(計 457 行)。product-master の spec は未変更 | 16 / 36 / pass | 8分 (23:17-23:25)。内訳: requirements 1分未満、design 3分、tasks 1分、impl 3分 | ターン内訳: 依頼 1 + 承認 3。完了前の自己修正 0 件。既存コード改変 3 ファイル: products.ts(ORDER BY 可変化 + 型)、page.tsx(th 置き換え・クエリ読み取り)、search-form.tsx(props に sort 追加、hidden input)。prompt-first と同じ 3 か所。要件で明文化した判断: 別列クリックは昇順から・同列は反転、price は数値順・他は文字列順、同値は id 昇順、JS 無効でも動く、ソート中の列のみ印 + aria-sort、検索時にソート保持・ソート切替時に検索語保持、不正 sort は既定・不正 order は昇順・order 省略は昇順、既定時は code に昇順の印。設計で明文化した判断: 解釈と URL 組み立てを純粋関数に集約、ヘッダ URL は常に sort/order を明示、検索フォームは hidden input(GET は action のクエリを捨てる)、文字列列は BINARY 照合のまま(Open Question として記録)、列名はホワイトリスト経由のみ SQL に埋め込む。設計と実装の乖離: なし。動作確認は Claude in Chrome(ヘッダクリック → 反転 → 検索でソート保持 → 別列でも検索語保持)+ curl(不正値のフォールバック、hidden input、href) |
| step3 edit-modal | 4 | 0 | 12 (.kiro 除く 7、新規 3: edit-product-modal.tsx, product-input.ts, product-input.test.ts) | +815 / -2 (.kiro 除く +322 / -2) | 新規: product-edit の requirements / research / design / tasks(計 493 行)。実装中に design.md を 1 か所更新(dialog の close はネイティブ購読) | 9 / 45 / pass | 10分 (23:26-23:36)。内訳: requirements 1分未満、design 3分、tasks 1分、impl 5分 | ターン内訳: 依頼 1 + 承認 3。完了前の自己修正 2 件: (1) 自作テストの期待値誤り(降順配列の添字)、(2) React が `<dialog>` の `onClose` を配信せず Esc 後に入力状態が戻らない → ブラウザ確認で発見、`useEffect` でネイティブ `close` を購読。既存コード改変 3 ファイル(actions.ts、products.ts、[id]/page.tsx)、いずれも追加のみ。prompt-first で自己修正だった「React 19 の action 後フォームリセットで入力値が消える」は、要件 2.5 と design(制御コンポーネント)で事前に扱われ、実装での手戻りなし。要件で明文化した判断: trim して必須判定、price の不正パターン列挙、複数エラー同時表示、エラー時の入力保持、サーバ側検証、note 空は未設定、リロードなしで詳細更新、不変列、削除済みの扱い、二重送信防止、Esc = キャンセル、再表示は保存済み値。設計で明文化した判断: ネイティブ dialog、検証は純粋関数、制御コンポーネント、price は text + inputMode、redirect せず revalidatePath + 成功状態、UPDATE の影響行数で不在判定。動作確認は Claude in Chrome(エラー 2 件同時表示と入力保持 → 保存でモーダル閉鎖・詳細と updated_at 更新 → 一覧に反映 → キャンセル / Esc で復元) |
| step4 bookmark | 4 | 0 | 18 (.kiro 除く 13、新規 3: 002 migration, bookmark-toggle.tsx, bookmark-filter-toggle.tsx) | +784 / -40 (.kiro 除く +301 / -40) | 新規: product-bookmark の requirements / research / design / tasks(計 483 行)。他 spec は未変更 | 11 / 56 / pass | 作業時間 約10分(requirements 1分未満 23:37、design 約3分 〜07:00、tasks 1分 07:03、impl 5分 07:05-07:10)。requirements 承認は翌朝のため待ち時間は除外 | ターン内訳: 依頼 1 + 承認 3。完了前の自己修正 1 件: 自作テストの準備不足(DB ディレクトリ未作成 + require import が lint 違反)。加えて検証手順のミス 1 件: curl で Server Action を直接叩く際に詳細ページ最初の form(削除)の ACTION_ID を拾い、シード 1 件を消した(アプリの挙動は正しい。returnTo を含む form に限定して再実行)。既存コード改変 7 ファイル + 既存テスト 1 ファイル(products.ts、list-url.ts、sort-header.tsx、search-form.tsx、products/page.tsx、[id]/page.tsx、actions.ts、db.test.ts)。design.md の Modified Files に全て事前列挙。prompt-first と同じく SortHeader / SearchForm の引数が増えた。要件で明文化した判断: 操作後は同じ画面(q / sort / bookmarked 保持)、JS 不要、不在は一覧へ、既存行は OFF、updated_at 不変、削除で消える、`1` 以外は無効、3 条件の相互保持、フィルタ中に OFF で行が消える、0 件メッセージ、行強調 + トグル見た目 + 詳細表示、aria-pressed。設計で明文化した判断: products にフラグ列(別テーブル不採用)、フォーム + Server Action + redirect、hidden に次の状態(冪等)、returnTo は safeReturnTo で内部パスに限定、行 → Product 変換を 1 か所に集約、フィルタはリンク。設計と実装の乖離: なし。動作確認は Claude in Chrome(☆→★ で行強調・URL 同じ → フィルタ ON → 検索でフィルタ維持 → フィルタ中に ★ を外すと行が消え 0 件メッセージ)+ curl(JS なし POST、外部 returnTo の拒否、不在 id、不正 bookmarked 値、hidden と href の 3 条件保持) |
| step5 auth | | | | | | | | |
| step6 authz | | | | | | | | |

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

