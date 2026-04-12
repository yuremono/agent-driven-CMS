---
name: task-log
description: 3step以上のtaskで実行
---

`$ARGUMENTS` を実行。

`/tasks/YYYYMMDD.yaml` を確認し、存在しなければ作成、taskを記録する。

---
task: "{task_name}"
completed_at: "YYYYMMDD HH:MM"
request_summary: ""
responce_summary: ""
---

<EXTREMELY-IMPORTANT>

## Execution rules
- ブラウザでの見た目確認、`$agent-browser` スキルはユーザーの指示がない限り実行しない。
- 軽微な修正では**test/buildを行わない** - API・状態管理・bridge・認証・ロジック変更のときだけ test/build を実施する。
- task は append-only : 既存エントリの削除・再作成はしない
- `/tasks/YYYYMMDD.yaml` を更新せずにユーザーに報告しないこと
- あなたが実行した行動をユーザーに**誤った行動**だと指摘されたら、論理的に分析して `tasks/learning.yaml` に追記する。存在しなければ作成する。

</EXTREMELY-IMPORTANT>





