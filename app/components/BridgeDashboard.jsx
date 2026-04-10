"use client";

import {
  decisionOptions,
  formatPercent,
  formatResetAt,
  formatWindow,
  requestTitle,
} from "./useBridgeSession.js";
import { useBridgeSessionContext } from "./BridgeSessionContext.jsx";

const shellClass = "shell adminShell mx-auto grid min-h-screen max-w-[1180px] gap-6";
const heroClass =
  "hero grid gap-6 rounded-[32px] border border-[rgba(42,31,20,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,255,255,0.16)),linear-gradient(180deg,rgba(181,83,35,0.12),rgba(255,255,255,0.2))] p-8 shadow-[0_18px_48px_rgba(39,24,12,0.12)] backdrop-blur";
const panelClass =
  "panel rounded-[24px] border border-[rgba(38,27,18,0.1)] bg-white/80 p-5 shadow-[0_18px_48px_rgba(39,24,12,0.12)] backdrop-blur";
const headerLabelClass =
  'm-0 font-["Iowan_Old_Style","Palatino_Linotype","Book_Antiqua",Georgia,serif] text-[11px] uppercase tracking-[0.18em] text-[#214d66]';
const titleClass =
  'font-["Iowan_Old_Style","Palatino_Linotype","Book_Antiqua",Georgia,serif] tracking-[-0.03em] text-[#1d1712]';
const mutedClass = "text-[#685f55]";
const chipClass =
  "inline-flex rounded-full bg-white/70 px-3 py-1.5 text-sm text-[#685f55] ring-1 ring-[rgba(38,27,18,0.08)]";
const secondaryButtonClass =
  "inline-flex w-fit items-center justify-center rounded-full border border-[rgba(32,77,102,0.16)] bg-white/70 px-4 py-2.5 text-sm text-[#214d66] transition duration-200 hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-60";
const primaryButtonClass =
  "inline-flex w-fit items-center justify-center rounded-full bg-[#b55323] px-5 py-3 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-60";

function PanelHeader({ title, description }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className={`${titleClass} text-[1.35rem]`}>{title}</h2>
      <p className={`m-0 text-sm leading-7 ${mutedClass}`}>{description}</p>
    </div>
  );
}

function MetaChip({ children }) {
  return <span className={chipClass}>{children}</span>;
}

export default function BridgeDashboard() {
  const {
    approvals,
    authBusy,
    authHelp,
    authLabel,
    authRoutes,
    canSubmit,
    capabilities,
    currentTurnId,
    events,
    handleApproval,
    handleLogin,
    handleLogout,
    handleRefreshAuth,
    handleRefreshRateLimits,
    handleSubmit,
    input,
    modelOptions,
    planSteps,
    provider,
    providerLabel,
    rateLimitSummary,
    rateLimitsBusy,
    replyText,
    respondingRequestId,
    selectedModel,
    setInput,
    setSelectedModel,
    showAuthHelp,
    status,
    statusLabel,
    submitLabel,
    supportsApprovals,
    supportsBrowserLogin,
    supportsBrowserLogout,
    supportsDiff,
    supportsPlan,
    supportsRateLimits,
    turnDiff,
    turnPlan,
  } = useBridgeSessionContext();

  return (
		<main className={shellClass}>
			<section className={heroClass}>
				<div className="grid gap-4">
					<p className={headerLabelClass}>Agent Driven CMS</p>
					<h1
						className={`${titleClass} text-[clamp(2.4rem,4.2vw,4.8rem)] leading-[0.95]`}
					>
						ローカル編集の運用状況を確認する管理ビュー
					</h1>
					<p
						className={`max-w-[60ch] text-[1.02rem] leading-8 ${mutedClass}`}
					>
						公開サイトに重ねる編集 UI
						の裏側を確認するための管理画面です。認証状態、 provider
						切替、承認待ち、diff、イベントをまとめて追えます。
					</p>
				</div>

				<aside
					className={`${panelClass} grid gap-4 lg:sticky lg:top-5`}
				>
					<div className="flex items-start justify-between gap-3">
						<div>
							<span className={headerLabelClass}>status</span>
							<div
								className={`mt-1 text-base font-medium text-[#1d1712]`}
							>
								{statusLabel}
							</div>
						</div>
						{supportsRateLimits ? (
							<button
								type="button"
								className={secondaryButtonClass}
								onClick={handleRefreshRateLimits}
								disabled={rateLimitsBusy}
							>
								{rateLimitsBusy
									? "refreshing..."
									: "refresh limits"}
							</button>
						) : (
							<span className={`text-sm ${mutedClass}`}>
								rate limits: unsupported
							</span>
						)}
					</div>

					<div className="flex flex-wrap gap-2">
						<MetaChip>provider: {providerLabel}</MetaChip>
						<MetaChip>thread: {status.threadId ?? "none"}</MetaChip>
						<MetaChip>pid: {status.pid ?? "stopped"}</MetaChip>
						<MetaChip>auth: {authLabel}</MetaChip>
						<MetaChip>approvals: {approvals.length}</MetaChip>
						{status.accountEmail ? (
							<MetaChip>account: {status.accountEmail}</MetaChip>
						) : null}
					</div>

					<div className="grid gap-3 rounded-[22px] bg-white/65 p-4 ring-1 ring-[rgba(38,27,18,0.08)]">
						<div className="flex items-center justify-between gap-3">
							<span className={headerLabelClass}>
								rate limits
							</span>
							<span className={`text-sm ${mutedClass}`}>
								{supportsRateLimits
									? status.rateLimits
										? "live"
										: "none"
									: "unsupported"}
							</span>
						</div>
						{supportsRateLimits && rateLimitSummary ? (
							<>
								<strong className="text-[#1d1712]">
									{rateLimitSummary.label}
								</strong>
								<div className="h-2 overflow-hidden rounded-full bg-[rgba(32,77,102,0.1)]">
									<span
										className="block h-full rounded-full bg-[#214d66]"
										style={{
											width: `${Math.min(Math.max(rateLimitSummary.usedPercent ?? 0, 0), 100)}%`,
										}}
									/>
								</div>
								<p
									className={`m-0 text-sm leading-7 ${mutedClass}`}
								>
									{formatPercent(
										rateLimitSummary.usedPercent,
									)}{" "}
									used ·{" "}
									{formatWindow(
										rateLimitSummary.windowDurationMins,
									)}{" "}
									window · reset{" "}
									{formatResetAt(rateLimitSummary.resetsAt)}
								</p>
							</>
						) : supportsRateLimits ? (
							<p
								className={`m-0 text-sm leading-7 ${mutedClass}`}
							>
								まだ rate limit の情報はありません。`refresh
								limits` で取得できます。
							</p>
						) : (
							<p
								className={`m-0 text-sm leading-7 ${mutedClass}`}
							>
								{providerLabel} では rate limits を browser
								bridge から取得しません。
							</p>
						)}
					</div>
				</aside>
			</section>

			<section className={panelClass}>
				<PanelHeader
					title="Composer"
					description="自然言語の編集指示をここから送ります。"
				/>
				<form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
					<textarea
						aria-label="Composer prompt"
						className="min-h-[112px] w-full resize-y rounded-2xl border border-[rgba(38,27,18,0.1)] bg-white/75 px-4 py-3 text-[#1d1712] outline-none placeholder:text-[--GR]"
						value={input}
						onChange={(event) => setInput(event.target.value)}
						placeholder="サービスページの導入文をもっと短くして"
						rows={4}
					/>
					{modelOptions.length > 0 ? (
						<label className="grid gap-2 text-sm text-[#685f55]">
							<span>Model</span>
							<select
								className="rounded-2xl border border-[rgba(38,27,18,0.1)] bg-white/75 px-4 py-3 text-[#1d1712] outline-none"
								value={selectedModel}
								onChange={(event) =>
									setSelectedModel(event.target.value)
								}
							>
								{modelOptions.map((option) => (
									<option
										key={option.value}
										value={option.value}
									>
										{option.label}
									</option>
								))}
							</select>
						</label>
					) : null}
					<button
						type="submit"
						className={primaryButtonClass}
						disabled={!canSubmit}
					>
						{submitLabel}
					</button>
				</form>
			</section>

			<section className={panelClass}>
				<PanelHeader
					title="Auth"
					description="認証状態と補助操作をここで確認します。"
				/>
				<div className="mt-4 grid gap-4">
					<div className="flex flex-wrap gap-2 text-sm">
						<MetaChip>provider: {provider}</MetaChip>
						<MetaChip>
							authMode: {status.authMode ?? "none"}
						</MetaChip>
						<MetaChip>
							account: {status.accountEmail ?? "none"}
						</MetaChip>
						<MetaChip>
							permission: {status.defaultPermissionMode ?? "n/a"}
						</MetaChip>
						{provider === "codex" ? (
							<MetaChip>
								requiresOpenaiAuth:{" "}
								{status.requiresOpenaiAuth == null
									? "unknown"
									: String(status.requiresOpenaiAuth)}
							</MetaChip>
						) : null}
					</div>

					{showAuthHelp ? (
						<div className="grid gap-2 rounded-[22px] bg-white/65 p-4 ring-1 ring-[rgba(38,27,18,0.08)]">
							<p
								className={`m-0 text-sm leading-7 ${mutedClass}`}
							>
								{authHelp.description}
							</p>
							<pre className="overflow-auto rounded-2xl bg-[#1d1712] px-4 py-3 text-sm leading-7 text-[#f7f2ea]">
								{authHelp.command}
							</pre>
						</div>
					) : null}

					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							className={secondaryButtonClass}
							onClick={handleRefreshAuth}
							disabled={authBusy}
						>
							refresh
						</button>
						{supportsRateLimits ? (
							<button
								type="button"
								className={secondaryButtonClass}
								onClick={handleRefreshRateLimits}
								disabled={rateLimitsBusy}
							>
								rate limits
							</button>
						) : null}
						{supportsBrowserLogin && authRoutes.login ? (
							<button
								type="button"
								className={secondaryButtonClass}
								onClick={handleLogin}
								disabled={authBusy}
							>
								login
							</button>
						) : null}
						{supportsBrowserLogout && authRoutes.logout ? (
							<button
								type="button"
								className={secondaryButtonClass}
								onClick={handleLogout}
								disabled={authBusy}
							>
								logout
							</button>
						) : null}
						{provider === "claude" ? (
							<span className={`text-sm ${mutedClass}`}>
								terminal only: `claude auth login`, `claude auth
								status`, `claude auth logout`
							</span>
						) : authRoutes.login ||
						  authRoutes.logout ||
						  authRoutes.account ? (
							<span className={`text-sm ${mutedClass}`}>
								routes:{" "}
								{[
									authRoutes.account ? "account" : null,
									authRoutes.login ? "login" : null,
									authRoutes.logout ? "logout" : null,
								]
									.filter(Boolean)
									.join(", ")}
							</span>
						) : (
							<span className={`text-sm ${mutedClass}`}>
								routes: (not exposed)
							</span>
						)}
					</div>
				</div>
			</section>

			<section className="grid gap-6">
				<article className={panelClass}>
					<PanelHeader
						title="Agent Reply"
						description="直近の応答をそのまま追えます。"
					/>
					<div className="mt-4 grid gap-3 rounded-[22px] bg-white/65 p-4 ring-1 ring-[rgba(38,27,18,0.08)]">
						<p className={`m-0 text-sm ${mutedClass}`}>
							turn: {currentTurnId ?? "none"}
						</p>
						<div className="whitespace-pre-wrap rounded-2xl bg-white px-4 py-3 leading-7 text-[#1d1712] ring-1 ring-[rgba(38,27,18,0.08)]">
							{replyText || "まだ回答はありません。"}
						</div>
					</div>
				</article>

				<article className={panelClass}>
					<PanelHeader
						title="Code Diff"
						description="diff と計画を同じカードで確認します。"
					/>
					<div className="mt-4 grid gap-3">
						{supportsDiff || supportsPlan ? (
							<>
								<p className={`m-0 text-sm ${mutedClass}`}>
									{turnPlan?.explanation ??
										"turn diff and plan"}
								</p>
								{supportsPlan && planSteps.length > 0 ? (
									<ol className="grid gap-2">
										{planSteps.map((step, index) => (
											<li
												key={`${step.step ?? index}-${index}`}
												className="flex items-start justify-between gap-4 rounded-2xl bg-white/70 px-4 py-3"
											>
												<span className="max-w-[70%] leading-7 text-[#1d1712]">
													{step.step ?? "step"}
												</span>
												<strong className="shrink-0 text-sm uppercase tracking-[0.14em] text-[#214d66]">
													{step.status ?? "pending"}
												</strong>
											</li>
										))}
									</ol>
								) : null}
								{supportsDiff ? (
									<pre className="max-h-[320px] overflow-auto rounded-2xl bg-[#1d1712] px-4 py-3 text-sm leading-7 text-[#f7f2ea]">
										{turnDiff || "まだ diff はありません。"}
									</pre>
								) : null}
							</>
						) : (
							<p
								className={`m-0 text-sm leading-7 ${mutedClass}`}
							>
								{providerLabel} では diff / plan ストリームを
								browser bridge に出しません。
							</p>
						)}
					</div>
				</article>

				<article className={panelClass}>
					<PanelHeader
						title="Pending Approvals"
						description="承認待ちの変更だけを一覧化します。"
					/>
					<div className="mt-4 grid gap-4">
						{!supportsApprovals ? (
							<p
								className={`m-0 text-sm leading-7 ${mutedClass}`}
							>
								{providerLabel} では browser approval flow
								を使いません。
							</p>
						) : approvals.length === 0 ? (
							<p
								className={`m-0 text-sm leading-7 ${mutedClass}`}
							>
								承認待ちはありません。
							</p>
						) : (
							approvals.map((request) => {
								const decisions = decisionOptions(
									request.method,
								);
								const params = request.params ?? {};

								return (
									<article
										key={request.requestId}
										className="grid gap-3 rounded-[22px] bg-white/70 p-4 ring-1 ring-[rgba(38,27,18,0.08)]"
									>
										<div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
											<strong className="text-[#1d1712]">
												{requestTitle(request.method)}
											</strong>
											<span
												className={`text-sm ${mutedClass}`}
											>
												request:{" "}
												{String(request.requestId)}
											</span>
										</div>
										{params.reason ? (
											<p
												className={`m-0 leading-7 ${mutedClass}`}
											>
												{params.reason}
											</p>
										) : null}
										{params.command ? (
											<p
												className={`m-0 grid gap-1 text-sm leading-7 ${mutedClass}`}
											>
												<span>cmd</span>
												<code className="overflow-x-auto rounded-xl bg-[#1d1712] px-3 py-2 text-[#f7f2ea]">
													{params.command}
												</code>
											</p>
										) : null}
										{params.cwd ? (
											<p
												className={`m-0 grid gap-1 text-sm leading-7 ${mutedClass}`}
											>
												<span>cwd</span>
												<code className="overflow-x-auto rounded-xl bg-[#1d1712] px-3 py-2 text-[#f7f2ea]">
													{params.cwd}
												</code>
											</p>
										) : null}
										{params.grantRoot ? (
											<p
												className={`m-0 grid gap-1 text-sm leading-7 ${mutedClass}`}
											>
												<span>root</span>
												<code className="overflow-x-auto rounded-xl bg-[#1d1712] px-3 py-2 text-[#f7f2ea]">
													{params.grantRoot}
												</code>
											</p>
										) : null}
										{Array.isArray(params.changes) &&
										params.changes.length > 0 ? (
											<div className="grid gap-2">
												{params.changes.map(
													(change, index) => (
														<pre
															key={`${change.path ?? "change"}-${index}`}
															className="overflow-x-auto rounded-2xl bg-[#1d1712] px-4 py-3 text-sm leading-7 text-[#f7f2ea]"
														>
															{`${change.kind ?? "change"}: ${change.path ?? "unknown"}\n${change.diff ?? ""}`}
														</pre>
													),
												)}
											</div>
										) : null}
										<div className="flex flex-wrap gap-2">
											{decisions.length > 0 ? (
												decisions.map((decision) => (
													<button
														key={decision}
														type="button"
														className={
															secondaryButtonClass
														}
														disabled={
															respondingRequestId ===
															request.requestId
														}
														onClick={() =>
															handleApproval(
																request,
																decision,
															)
														}
													>
														{decision}
													</button>
												))
											) : (
												<span
													className={`text-sm ${mutedClass}`}
												>
													この request
													は手動応答の実装待ちです。
												</span>
											)}
										</div>
									</article>
								);
							})
						)}
					</div>
				</article>
			</section>

			<section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
				<article className={panelClass}>
					<PanelHeader
						title="Events"
						description="SSE で届くイベントを最新順に並べます。"
					/>
					<div className="mt-4 grid max-h-[360px] gap-2 overflow-auto">
						{events.length === 0 ? (
							<p
								className={`m-0 text-sm leading-7 ${mutedClass}`}
							>
								まだイベントはありません。
							</p>
						) : (
							events.map((event, index) => (
								<pre
									key={index}
									className="overflow-x-auto rounded-2xl bg-[#1d1712] px-4 py-3 text-sm leading-7 text-[#f7f2ea]"
								>
									{JSON.stringify(event, null, 2)}
								</pre>
							))
						)}
					</div>
				</article>

				<article className={panelClass}>
					<PanelHeader
						title="Notes"
						description="運用時に忘れたくない前提を残します。"
					/>
					<ul className="mt-4 grid gap-3 pl-5 text-[#685f55]">
						<li>API key は repo に置かない</li>
						<li>
							認証状態は provider ごとに bridge 側で確認してから
							thread を開始する
						</li>
						<li>
							Codex は app-server、Claude は CLI を server
							側で中継する
						</li>
						<li>ブラウザは SSE でイベントを受ける</li>
						<li>provider の切替は browser ではなく起動時に行う</li>
					</ul>
				</article>
			</section>
		</main>
  );
}
