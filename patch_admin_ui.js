const fs = require('fs');
let content = fs.readFileSync('app/admin/AdminPageClient.tsx', 'utf-8');

const viewsCards = `              {/* View Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
                    <Eye className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{posts.reduce((acc, p) => acc + (p.views || 0), 0) + reels.reduce((acc, r) => acc + (r.views || 0), 0) + videos.reduce((acc, v) => acc + (v.views || 0), 0)}</div>
                  <div className="text-[11px] text-zinc-500 font-semibold mt-1">All time</div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Today's Views</span>
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{dailyStats[dailyStats.length - 1]?.views || 0}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-1">Current day</div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Weekly Views</span>
                    <BarChartIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{dailyStats.slice(-7).reduce((acc, d) => acc + (d.views || 0), 0)}</div>
                  <div className="text-[11px] text-purple-400 font-semibold mt-1">Past 7 days</div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Monthly Views</span>
                    <Globe className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{dailyStats.slice(-30).reduce((acc, d) => acc + (d.views || 0), 0)}</div>
                  <div className="text-[11px] text-amber-400 font-semibold mt-1">Past 30 days</div>
                </div>
              </div>
              
`;

content = content.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">/,
  viewsCards + '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">'
);

// Add the Area for Daily Views to the chart
content = content.replace(
  /<Area type="monotone" dataKey="uploads".*?\/>/,
  `$&
                      <Area type="monotone" dataKey="views" stroke="#eab308" fill="#eab308" fillOpacity={0.1} name="Views" />`
);

fs.writeFileSync('app/admin/AdminPageClient.tsx', content);
