---
name: task-large
description: 5step以上のtask、4step以下の影響範囲が広い、設計判断が入るtaskで実行
---

 - `/tasks/learning.yaml` を確認する。存在しなければ作成する。

- plan モードに入る、またはユーザーに plan mode に切り替えることを促す。

- `/tasks/` に {task_name} を含む類似taskファイルが存在する場合、plan モードでユーザーに継続するか新規作成するかを確認する。

- `$ARGUMENTS` に具体的な指示がない場合。既存コードベースの調査を行わず plan モードで質問する。

- `/tasks/YYYYMMDD_{task_name}.yaml` を作成する。

- {task_name} のない `/tasks/YYYYMMDD.yaml` は`task-large`では更新しない。

---
task: "{task_name}"
status: "todo" # todo | in_progress | blocked | done
created_at: "YYYYMMDD HH:MM"
completed_at: "YYYYMMDD HH:MM"
request_description: "{200文字以内であればユーザーのリクエストをそのまま入力。200文字以上であれば計画中のユーザーの発言を含めて200文字以内で要点をまとめる}"
requiment:  "**メインセッションに存在するあなた**の言葉で200文字以内で`large_task`を実行する理由と行動計画の概要を入力する"
descriptions:
  - "[agent_name_HH:MM] subagent の個別の進捗・報告を100文字以内で記録する"
  - "[agent_name_HH:MM] subagent の個別の進捗・報告を100文字以内で記録する"
  - ...
---

- 依存関係に注意し task を分割する

- チームを編成しsubagentの役割を与える。

- チームが編成できない場合は適切なsubagentを利用する

- ユーザーの指示またはあなたの判断で git worktree を構成する。`{Project_ROOT}/GITWORKFLOW.md` を参照する。

- メインセッションに存在するあなたは**調査、編集、検証、テストを行わない**、**全ての実行をsubagentに委任する。**

- subagent の初回の指示に以下の文章を必ず含める
---
 `tasks/learning.yaml` を呼んでからtaskを実行すること。
---

- 全ての task が完了したら `/tasks/YYYYMMDD_{task_name}.yaml` を更新し、ユーザーに報告する




<EXTREMELY-IMPORTANT>

## Execution rules

- {task_name} のない `/tasks/YYYYMMDD.yaml` は`task-large`では更新しない。
- task終了時に日付が変わっていても、新しい `/tasks/YYYYMMDD_{task_name}.yaml` は作成せず、開始時のtaskのファイルに書き込む。
-  `descriptions` は append-only : 既存エントリの削除・再作成は禁止
- API・状態管理・bridge・認証・ロジック変更のときだけ test/build を実施し。必ず報告する
- `/tasks/YYYYMMDD_{task_name}.yaml` を更新せずにユーザーに報告しないこと
- あなたやサブエージェントが実行した行動をユーザーに**誤った行動**だと指摘されたら、論理的に分析して `tasks/learning.yaml` に追記する。
- `$ARGUMENTS` に具体的な指示がない場合。既存コードベースの調査を行わず plan モードで質問する。

選択の余地はありません。必ず従わなければいけません。
これは交渉不可です。任意ではありません。理屈で回避することはできません。

</EXTREMELY-IMPORTANT>



