"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tournament } from "@/types/tournament";
import { useAdminPanelContext } from "./admin-panel-context";
import { STATUS_STYLES } from "./constants";

export function TournamentsTab() {
  const ctx = useAdminPanelContext();
  return (
<div className="mt-10 grid gap-8 xl:grid-cols-[460px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Tournament Management</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create, customize, update, or delete a specific tournament.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Tournament Name</label>
              <input
                value={ctx.tournamentName}
                onChange={(event) => ctx.setTournamentName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                placeholder="e.g. Weekend Elite Cup"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Status</label>
                <select
                  aria-label="Tournament status"
                  value={ctx.tournamentStatus}
                  onChange={(event) => ctx.setTournamentStatus(event.target.value as Tournament["status"])}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Live">Live</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Participants</label>
                <input
                  type="number"
                  aria-label="Tournament participants"
                  value={ctx.tournamentParticipants}
                  readOnly
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">Auto-calculated from the points table teams.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Budget</label>
                <input
                  type="number"
                  aria-label="Tournament budget"
                  value={ctx.tournamentBudget}
                  onChange={(event) => ctx.setTournamentBudget(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Max</label>
                <input
                  type="number"
                  aria-label="Tournament max ctx.players"
                  value={ctx.tournamentMaxPlayers}
                  onChange={(event) => ctx.setTournamentMaxPlayers(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Min</label>
                <input
                  type="number"
                  aria-label="Tournament min ctx.players"
                  value={ctx.tournamentMinPlayers}
                  onChange={(event) => ctx.setTournamentMinPlayers(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
              <label className="mb-1 block text-sm text-slate-200">Team Names</label>
              <p className="mb-2 text-xs text-slate-400">Add one team per line.</p>
              <textarea
                aria-label="Tournament team names"
                value={ctx.teamNamesInput}
                onChange={(event) => ctx.setTeamNamesInput(event.target.value)}
                rows={6}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                placeholder={"Arsenal\nManchester City\nLiverpool\nChelsea"}
              />

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-cyan-500/30 bg-transparent text-cyan-200 hover:bg-cyan-500/10"
                  onClick={ctx.buildStandingsFromTeams}
                >
                  Build Table From Teams
                </Button>
                <Button
                  type="button"
                  className="bg-cyan-400 text-black hover:bg-cyan-300"
                  onClick={ctx.generateRandomFixtures}
                >
                  Generate Random Fixtures
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-200">Points Table</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10"
                    onClick={ctx.recalculateStandingsFromFixtures}
                  >
                    Recalculate Table
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                    onClick={ctx.addStandingRow}
                  >
                    Add Team Row
                  </Button>
                </div>
              </div>

              {ctx.tournamentStandings.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">No teams yet. Add team names and build table.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-[900px] w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400">
                        <th className="px-2 py-2">Team</th>
                        <th className="px-2 py-2">P</th>
                        <th className="px-2 py-2">W</th>
                        <th className="px-2 py-2">D</th>
                        <th className="px-2 py-2">L</th>
                        <th className="px-2 py-2">GF</th>
                        <th className="px-2 py-2">GA</th>
                        <th className="px-2 py-2">Pts</th>
                        <th className="px-2 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ctx.tournamentStandings.map((row, index) => (
                        <tr key={`standing-${index}`} className="border-t border-white/10">
                          <td className="px-2 py-2">
                            <input
                              aria-label={`Standing team ${index + 1}`}
                              value={row.team}
                              onChange={(event) => ctx.updateStanding(index, "team", event.target.value)}
                              className="w-full rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          {(["played", "won", "draw", "lost", "goalsFor", "goalsAgainst", "points"] as const).map((field) => (
                            <td key={field} className="px-2 py-2">
                              <input
                                type="number"
                                aria-label={`${field} for ${row.team || `team ${index + 1}`}`}
                                value={row[field]}
                                onChange={(event) => ctx.updateStanding(index, field, event.target.value)}
                                className="w-16 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                              />
                            </td>
                          ))}
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                              onClick={() => ctx.removeStandingRow(index)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-200">Fixtures</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                    onClick={ctx.addFixtureRow}
                  >
                    Add Fixture
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-amber-500/30 bg-transparent text-amber-300 hover:bg-amber-500/10"
                    onClick={() => ctx.setTournamentFixtures([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {ctx.tournamentFixtures.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">No fixtures yet. Generate or add fixtures manually.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-[1180px] w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400">
                        <th className="px-2 py-2">Round</th>
                        <th className="px-2 py-2">Home</th>
                        <th className="px-2 py-2">Away</th>
                        <th className="px-2 py-2">Kickoff</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Home Score</th>
                        <th className="px-2 py-2">Away Score</th>
                        <th className="px-2 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ctx.tournamentFixtures.map((fixture, index) => (
                        <tr key={fixture.id || `fixture-${index}`} className="border-t border-white/10">
                          <td className="px-2 py-2">
                            <input
                              aria-label={`Round for fixture ${index + 1}`}
                              value={fixture.round}
                              onChange={(event) => ctx.updateFixture(index, "round", event.target.value)}
                              className="w-28 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              aria-label={`Home team for fixture ${index + 1}`}
                              value={fixture.homeTeam}
                              onChange={(event) => ctx.updateFixture(index, "homeTeam", event.target.value)}
                              className="w-40 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              aria-label={`Away team for fixture ${index + 1}`}
                              value={fixture.awayTeam}
                              onChange={(event) => ctx.updateFixture(index, "awayTeam", event.target.value)}
                              className="w-40 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              aria-label={`Kickoff for fixture ${index + 1}`}
                              value={fixture.kickoff}
                              onChange={(event) => ctx.updateFixture(index, "kickoff", event.target.value)}
                              className="w-40 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              aria-label={`Status for fixture ${index + 1}`}
                              value={fixture.status}
                              onChange={(event) => ctx.updateFixture(index, "status", event.target.value)}
                              className="w-28 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="Live">Live</option>
                              <option value="Finished">Finished</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              aria-label={`Home score for fixture ${index + 1}`}
                              value={fixture.homeScore ?? ""}
                              onChange={(event) => ctx.updateFixture(index, "homeScore", event.target.value)}
                              className="w-24 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              aria-label={`Away score for fixture ${index + 1}`}
                              value={fixture.awayScore ?? ""}
                              onChange={(event) => ctx.updateFixture(index, "awayScore", event.target.value)}
                              className="w-24 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                              onClick={() => ctx.removeFixtureRow(index)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {ctx.tournamentError ? <p className="text-sm text-red-400">{ctx.tournamentError}</p> : null}

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                disabled={ctx.savingTournament}
                className="w-full bg-cyan-400 text-black hover:bg-cyan-300"
                onClick={ctx.saveTournament}
              >
                {ctx.savingTournament ? "Saving..." : ctx.editingTournamentId ? "Update Tournament" : "Create Tournament"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={ctx.resetTournamentForm}
              >
                Reset Form
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Tournament List</h2>
              <p className="mt-1 text-sm text-slate-400">
                Select any tournament to customize or delete.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => ctx.fetchTournaments()}
              disabled={ctx.tournamentsLoading}
            >
              {ctx.tournamentsLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {ctx.tournamentsLoading ? (
            <p className="mt-4 text-slate-400">Loading tournaments...</p>
          ) : ctx.managedTournaments.length === 0 ? (
            <p className="mt-4 text-slate-400">No custom tournaments found yet. Create one from the left panel.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {ctx.managedTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className={`rounded-xl border px-4 py-3 ${ctx.editingTournamentId === tournament.id ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-slate-950/60"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{tournament.name}</p>
                      <p className="text-xs text-slate-500">
                        {tournament.status} • Participants: {tournament.participants} • Budget: {tournament.budget}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-cyan-500/30 bg-transparent text-cyan-300 hover:bg-cyan-500/10"
                        onClick={() => ctx.loadTournamentForEdit(tournament)}
                      >
                        Customize
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                        onClick={() => ctx.deleteTournament(tournament.id)}
                        disabled={ctx.deletingTournamentId === tournament.id}
                      >
                        {ctx.deletingTournamentId === tournament.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
