// 文章模块生成器：原创生成「人民日报风格」双语长文（英文 + 中文对照）
// 设计原则：
//  1) 原创生成，不复制任何受版权保护的真实新闻；英文与中文由同一套双语语块同步产出，保证左右逐段对应。
//  2. 每篇文章中文翻译 ≥ MIN_ZH 字（默认 5000），英文对应；用于雅思泛读/精读长文训练。
//  3. 类目覆盖人民日报常见版面（时政/经济/文化/科技/环境/社会/国际/教育/健康/体育）。
//  4. 喇叭朗读英文由前端浏览器免费 TTS（Web Speech API）负责，与题目朗读复用 useSpeech。
// 运行：node server/scripts/generateArticles.js
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', '..', 'src', 'mock', 'articles')
mkdirSync(outDir, { recursive: true })

// ---------------- 基础工具 ----------------
const rnd = (n) => Math.floor(Math.random() * n)
const pick = (a) => a[rnd(a.length)]
const pickPaired = (a) => {
  const p = a[rnd(a.length)]
  return { en: p.en, zh: p.zh }
}
const randInt = (a, b) => a + rnd(b - a + 1)
const chance = (p) => Math.random() < p

// ---------------- 共享双语词池（成对：en/zh） ----------------
const CITY = [
  { en: 'Beijing', zh: '北京' }, { en: 'Shanghai', zh: '上海' },
  { en: 'Guangzhou', zh: '广州' }, { en: 'Shenzhen', zh: '深圳' },
  { en: 'Chengdu', zh: '成都' }, { en: 'Hangzhou', zh: '杭州' },
  { en: "Xi'an", zh: '西安' }, { en: 'Wuhan', zh: '武汉' },
  { en: 'Nanjing', zh: '南京' }, { en: 'Tianjin', zh: '天津' },
  { en: 'Qingdao', zh: '青岛' }, { en: 'Suzhou', zh: '苏州' },
]
const ORG = [
  { en: 'the Ministry of Education', zh: '教育部' },
  { en: 'the National Development and Reform Commission', zh: '国家发展和改革委员会' },
  { en: 'the Ministry of Ecology and Environment', zh: '生态环境部' },
  { en: 'the Ministry of Science and Technology', zh: '科技部' },
  { en: 'the Ministry of Culture and Tourism', zh: '文化和旅游部' },
  { en: 'the General Administration of Sport', zh: '国家体育总局' },
  { en: 'the National Health Commission', zh: '国家卫生健康委员会' },
  { en: 'the local government', zh: '地方政府' },
  { en: 'the municipal committee', zh: '市委' },
  { en: 'the research academy', zh: '研究院' },
  { en: 'the provincial department', zh: '省主管部门' },
  { en: 'the development zone', zh: '开发区管委会' },
]
const MONTH = [
  { en: 'January', zh: '1月' }, { en: 'February', zh: '2月' }, { en: 'March', zh: '3月' },
  { en: 'April', zh: '4月' }, { en: 'May', zh: '5月' }, { en: 'June', zh: '6月' },
  { en: 'July', zh: '7月' }, { en: 'August', zh: '8月' }, { en: 'September', zh: '9月' },
  { en: 'October', zh: '10月' }, { en: 'November', zh: '11月' }, { en: 'December', zh: '12月' },
]
const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
const NAME = [
  { en: 'Professor Li', zh: '李教授' }, { en: 'Dr. Wang', zh: '王博士' },
  { en: 'researcher Zhang', zh: '张研究员' }, { en: 'Director Chen', zh: '陈主任' },
  { en: 'expert Zhao', zh: '赵专家' }, { en: 'Professor Liu', zh: '刘教授' },
]
const SECTOR = [
  { en: 'the manufacturing sector', zh: '制造业' }, { en: 'the service industry', zh: '服务业' },
  { en: 'the agricultural sector', zh: '农业' }, { en: 'the education system', zh: '教育体系' },
  { en: 'the healthcare system', zh: '医疗体系' }, { en: 'the transport network', zh: '交通网络' },
]

// ---------------- 通用双语语块（人民网风格，跨类目复用） ----------------
// 每个块 en/zh 成对，使用共享 token；同 ctx 填充保证左右一致。
const GENERIC = [
  { en: `{orgEn} said it will implement all tasks with unwavering perseverance and a focus on real outcomes.`, zh: `{orgZh}表示，将以钉钉子精神抓好各项任务落实，务求实效。` },
  { en: `Local authorities explored development paths suited to their own conditions and local strengths.`, zh: `各地结合实际，积极探索符合本地特点与优势的发展路径。` },
  { en: `Data shows the relevant indicators have stayed on an upward trend for several consecutive quarters.`, zh: `数据显示，相关指标已连续多个季度保持向好态势。` },
  { en: `Experts noted that institutional building is the key to sustaining long-term results.`, zh: `专家学者指出，制度建设是保障长效运行的关键所在。` },
  { en: `People's sense of gain, happiness and security has kept growing in recent years.`, zh: `近年来，人民群众的获得感、幸福感、安全感不断增强。` },
  { en: `A coordinated approach across departments helped avoid duplication and wasted effort.`, zh: `跨部门协同推进，避免了重复建设与资源浪费。` },
  { en: `The plan sets clear milestones and assigns responsibility to specific offices.`, zh: `该计划设定了清晰的时间节点，并将责任落实到具体部门。` },
  { en: `Public feedback was collected through hearings, surveys and online platforms.`, zh: `通过听证会、问卷调查与线上平台等多种渠道，广泛征集公众意见。` },
  { en: `Officials stressed that progress must be measurable and open to public oversight.`, zh: `官员强调，各项工作必须可量化、可考核，并接受公众监督。` },
  { en: `Pilot programmes in selected districts provided useful lessons before wider rollout.`, zh: `在部分区域先行试点的经验，为后续全面推开提供了有益借鉴。` },
  { en: `Investment in talent and infrastructure laid a solid foundation for future growth.`, zh: `在人才与基础设施上的投入，为未来发展奠定了坚实基础。` },
  { en: `The reform aims to streamline procedures and reduce the burden on ordinary citizens.`, zh: `此次改革旨在精简流程，切实减轻普通群众的办事负担。` },
  { en: `Observers praised the balance between ambitious goals and pragmatic, step-by-step delivery.`, zh: `观察人士称赞其在宏伟目标与务实稳妥的分步推进之间取得了平衡。` },
  { en: `A dedicated task force will monitor implementation and report quarterly to the public.`, zh: `专项工作组将跟踪落实进展，并按季度向社会公开报告。` },
  { en: `Cross-regional cooperation allowed resources and expertise to be shared more efficiently.`, zh: `跨区域协作使资源与经验得以更高效共享。` },
  { en: `The initiative reflects a broader commitment to high-quality and inclusive development.`, zh: `该举措体现了对于高质量发展与包容性增长的更高追求。` },
  { en: `Residents reported visible improvements in daily services and community amenities.`, zh: `居民反映，日常服务与社区配套设施已出现可见改善。` },
  { en: `Standards and evaluation systems were upgraded to keep pace with changing needs.`, zh: `标准与考核体系同步升级，以跟上不断变化的需求。` },
  { en: `Digital tools were adopted to make services more accessible and transparent.`, zh: `借助数字化手段，服务变得更加便捷、透明。` },
  { en: `Long-term monitoring will track outcomes and guide adjustments over the coming years.`, zh: `将通过长期监测跟踪成效，并在未来数年据此动态优化。` },
  { en: `{nameEn} of {orgEn} said the experience could be adapted by other regions.`, zh: `{nameZh}表示，这一经验可供其他地区因地制宜借鉴。` },
  { en: `The city aims to scale up successful pilots and consolidate gains by the end of {year}.`, zh: `该市目标在{year}年底前推广成功试点，巩固已有成果。` },
  { en: `Policymakers highlighted the need to protect vulnerable groups during the transition.`, zh: `政策制定者强调，在转型过程中须重点保障弱势群体。` },
  { en: `A performance-based incentive scheme motivated frontline workers and local teams.`, zh: `以实绩为导向的激励办法，有效调动了基层队伍的积极性。` },
  { en: `The programme reduced paperwork and shortened processing times by roughly {pct}%.`, zh: `该计划使文书工作量减少，办理时限平均缩短约{pct}%。` },
  { en: `More than {num} thousand opinions were gathered, most of them constructive and specific.`, zh: `共收集到超过{num}千条意见，其中大多具有建设性与针对性。` },
  { en: `Funding of about {amount} billion yuan was earmarked for the first phase of the work.`, zh: `首期工作已专门安排约{amount}亿元资金予以保障。` },
  { en: `The approach was welcomed by communities as practical and responsive to real needs.`, zh: `此举因贴近实际需求、务实管用，受到基层群众欢迎。` },
  { en: `Regular reviews ensured problems were identified early and corrected without delay.`, zh: `通过定期评估，问题得以及早发现、及时纠偏。` },
  { en: `Officials pledged stable, predictable policies to support sustained confidence.`, zh: `官员承诺保持政策稳定可预期，以稳固各方信心。` },
  { en: `The model has been cited as an example worth studying by peer cities.`, zh: `该模式已被同类城市作为可资研究的范例加以援引。` },
  { en: `Training covered {num} thousand personnel, strengthening capacity at the grassroots.`, zh: `培训覆盖{num}千名工作人员，增强了基层一线执行力。` },
  { en: `Transparency measures included publishing key data and inviting independent audits.`, zh: `透明化举措包括公开关键数据并引入独立审计。` },
  { en: `The strategy places people at the centre and links development to everyday wellbeing.`, zh: `该战略坚持以人为中心，把发展与群众日常福祉紧密挂钩。` },
  { en: `Coordination mechanisms were strengthened to align plans across levels of government.`, zh: `通过健全协调机制，推动各层级规划有效衔接。` },
  { en: `Early results exceeded expectations and encouraged further investment in the area.`, zh: `初期成效超出预期，也提振了各方继续投入的信心。` },
  { en: `The work is part of a wider agenda to modernise governance and public services.`, zh: `此项工作系推进治理与服务现代化整体部署的组成部分。` },
  { en: `Lessons learned will inform next year's plan and a broader set of pilot districts.`, zh: `相关经验将用于完善下一年度方案，并拓展更多试点区域。` },
  { en: `Stakeholders from business, academia and civil society took part in the design.`, zh: `企业、学界与社会组织等多方利益相关者参与了方案设计。` },
  { en: `The city reported steady progress and few major disruptions during implementation.`, zh: `该市通报称，落实过程总体平稳有序，未出现大的波折。` },
]

// ---------------- 类目专属双语语块 ----------------
const CATEGORY_POOL = {
  politics: [
    { en: `Rural revitalization advanced through industry support and better public services.`, zh: `乡村振兴通过产业扶持与公共服务提升稳步推进。` },
    { en: `Poverty-alleviation gains were consolidated to prevent a return to hardship.`, zh: `巩固脱贫成果，坚决防止出现规模性返贫。` },
    { en: `Grassroots governance improved via grid management and resident participation.`, zh: `依托网格化管理与居民参与，基层治理效能持续提升。` },
    { en: `Administrative streamlining cut redundant approvals and improved efficiency.`, zh: `简政放权精简了冗余审批环节，行政效率明显提高。` },
    { en: `Cadre training emphasised integrity, capability and service to the people.`, zh: `干部队伍建设突出廉洁、能力与为民服务意识。` },
    { en: `Public-service centres brought more procedures to residents' doorsteps.`, zh: `公共服务中心把更多事项办到了群众家门口。` },
    { en: `Village-level organisations played a bigger role in mobilising communities.`, zh: `村级组织在党的引领下，在动员群众方面发挥了更大作用。` },
    { en: `A credit-rating system encouraged lawful and trustworthy behaviour.`, zh: `信用评价体系引导群众守法守信、向上向善。` },
    { en: `The reform balanced central direction with local flexibility and initiative.`, zh: `改革在顶层设计与地方积极性之间实现了有机统一。` },
    { en: `Open government expanded so citizens can follow decisions that affect them.`, zh: `政务公开持续拓展，群众关心的决策更加可知可感。` },
    { en: `Mediation teams resolved disputes at an early stage within the community.`, zh: `调解队伍将矛盾纠纷化解在社区、化解在萌芽。` },
    { en: `Digital countryside initiatives narrowed the urban-rural service gap.`, zh: `数字乡村建设有效缩小了城乡公共服务差距。` },
  ],
  economy: [
    { en: `High-tech manufacturing became a main engine of local industrial upgrading.`, zh: `高技术制造业成为当地产业升级的主要引擎。` },
    { en: `Cross-border trade grew as logistics links with partner regions improved.`, zh: `随着与伙伴地区物流联通改善，跨境贸易持续扩大。` },
    { en: `Small businesses received tax relief and easier access to credit.`, zh: `中小企业获得税收减免，融资可得性明显提升。` },
    { en: `Consumer spending recovered on the back of steady income growth.`, zh: `在收入稳步增长带动下，居民消费逐步恢复。` },
    { en: `Green finance channelled capital toward low-carbon and circular projects.`, zh: `绿色金融引导资本流向低碳与循环经济项目。` },
    { en: `The digital economy expanded into agriculture, retail and public services.`, zh: `数字经济加速向农业、零售与公共服务领域延伸。` },
    { en: `Foreign investment rose in advanced manufacturing and modern services.`, zh: `先进制造业与现代服务业实际使用外资稳步增长。` },
    { en: `A business environment index improved after regulatory reforms.`, zh: `监管改革落地后，营商环境指数稳步走高。` },
    { en: `Industrial parks clustered firms to share supply chains and talent.`, zh: `产业园区推动企业集聚，共享供应链与人才资源。` },
    { en: `Employment remained stable thanks to support for micro and small firms.`, zh: `对小微企业的帮扶，使就业大盘保持总体稳定。` },
    { en: `Exports of high-value goods offset weaker demand in traditional lines.`, zh: `高附加值商品出口增长，弥补了传统品类需求的走弱。` },
    { en: `Regional coordination reduced redundant competition between neighbouring cities.`, zh: `区域协调推进，缓解了相邻城市间的同质化竞争。` },
  ],
  culture: [
    { en: `Intangible heritage was kept alive through workshops and youth programmes.`, zh: `依托传习所与青少年活动，非物质文化遗产得以活态传承。` },
    { en: `Public libraries extended opening hours and added community reading spaces.`, zh: `公共图书馆延长开放时间，增设社区阅读空间。` },
    { en: `Traditional opera reached younger audiences via short videos and tours.`, zh: `传统戏曲借助短视频与巡演，走近了年轻观众。` },
    { en: `Creative industries blended local culture with design and technology.`, zh: `创意产业将本土文化与设计、科技相融合。` },
    { en: `Museum exhibitions drew record visitors with immersive displays.`, zh: `博物馆以沉浸式展陈吸引观众，参观人数创出新高。` },
    { en: `A reading campaign delivered books to schools in remote counties.`, zh: `阅读活动向偏远县域学校送去了大量图书。` },
    { en: `Cultural tourism revitalised historic streets and boosted local incomes.`, zh: `文旅融合让老街焕发新生，也带动了群众增收。` },
    { en: `Arts education in schools nurtured appreciation from an early age.`, zh: `学校艺术教育从小培养了学生对美的感知与兴趣。` },
    { en: `Digital archives opened rare collections to a global online audience.`, zh: `数字档案让珍稀馆藏走向全球在线观众。` },
    { en: `City festivals strengthened social bonds and a shared local identity.`, zh: `城市节庆增进了社会联结，也强化了共同的地方认同。` },
    { en: `Craftsmanship was recognised as both heritage and a living livelihood.`, zh: `工匠精神既被视为文化遗产，也被肯定为一种生计。` },
    { en: `Exchange programmes let local artists learn from counterparts abroad.`, zh: `交流项目让本土艺术家得以与海外同行切磋互鉴。` },
  ],
  technology: [
    { en: `Artificial intelligence sped up routine analysis in clinics and labs.`, zh: `人工智能加快了诊所与实验室中常规分析的速度。` },
    { en: `Renewable energy supplied a growing share of the city's power mix.`, zh: `可再生能源在城市能源结构中的占比持续提高。` },
    { en: `Smart manufacturing lifted productivity with flexible, connected lines.`, zh: `智能制造以柔性化、互联化的产线提升了生产效率。` },
    { en: `Space exploration milestones inspired students to pursue science.`, zh: `太空探索取得里程碑进展，也激励了青少年投身科学。` },
    { en: `Biomedical research produced candidate tools for earlier diagnosis.`, zh: `生物医学研究催生了用于更早期诊断的候选手段。` },
    { en: `Cloud computing lowered costs for startups and public agencies alike.`, zh: `云计算降低了初创企业与公共机构的用算成本。` },
    { en: `A new compute cluster cut model training time by about {pct}%.`, zh: `新的计算集群将模型训练时间缩短约{pct}%。` },
    { en: `Open datasets let universities and firms build on shared foundations.`, zh: `开放数据集使高校与企业能在共同基础上持续创新。` },
    { en: `Engineers designed the system to be safe, auditable and energy-efficient.`, zh: `工程师将该系统设计得安全、可审计且节能。` },
    { en: `Field tests showed a {pct}% gain in detection accuracy over the baseline.`, zh: `现场测试显示，检测准确率较基准提升了{pct}%。` },
    { en: `Standards groups drafted guidelines for the responsible use of the tech.`, zh: `标准组织起草了该技术负责任应用的指引。` },
    { en: `Talent programmes attracted overseas experts to the local ecosystem.`, zh: `人才计划吸引了海外专家融入本地创新生态。` },
  ],
  environment: [
    { en: `Afforestation expanded green cover and helped stabilise local climate.`, zh: `植树造林扩大了绿量，也有助于稳定局地气候。` },
    { en: `Air-quality control cut fine-particle levels across the metropolitan area.`, zh: `空气质量治理使都市圈细颗粒物浓度下降。` },
    { en: `Wetland protection restored habitats for migratory birds and fish.`, zh: `湿地保护修复了候鸟与鱼类的栖息环境。` },
    { en: `Waste sorting became routine in most urban residential communities.`, zh: `垃圾分类在多数城市社区已成为日常习惯。` },
    { en: `River restoration improved water quality and revived riverside life.`, zh: `河流修复改善了水质，也唤回了滨水生机。` },
    { en: `Low-carbon city pilots promoted walking, cycling and public transit.`, zh: `低碳城市试点倡导步行、骑行与公共交通出行。` },
    { en: `Emissions fell by an average of {pct}% compared with the previous year.`, zh: `与上年相比，主要污染物排放平均下降{pct}%。` },
    { en: `Green bonds financed about {amount} billion yuan of ecological projects.`, zh: `绿色债券为约{amount}亿元生态项目提供了资金。` },
    { en: `Real-time sensors monitored water and air at {num} monitoring points.`, zh: `传感器在{num}个监测点对水、气质量实时监测。` },
    { en: `The city pledged to peak carbon emissions before {year}.`, zh: `该市承诺在{year}前实现碳达峰。` },
    { en: `Volunteers planted {num} thousand trees along rivers and roads.`, zh: `志愿者在江河与道路沿线植树{num}千棵。` },
    { en: `Long-term ecology tracking will span the next decade and beyond.`, zh: `生态长期监测将延续至未来十年乃至更久。` },
  ],
  society: [
    { en: `Elderly care expanded day services and home visits for the aged.`, zh: `养老照护拓展了日间照料与上门服务。` },
    { en: `Community services reached more neighbourhoods with free offerings.`, zh: `社区服务以免费项目覆盖了更多街区。` },
    { en: `Employment support helped {num} thousand job seekers find work.`, zh: `就业帮扶帮助{num}千名求职者实现就业。` },
    { en: `Disability inclusion opened schools and workplaces to all abilities.`, zh: `残障融合让学校与职场向不同能力者敞开。` },
    { en: `Volunteerism grew as residents organised mutual-aid networks.`, zh: `随着居民互助网络组建，志愿服务日益活跃。` },
    { en: `Food-safety inspections tightened across markets and canteens.`, zh: `食品安全检查在农贸市场与食堂全面加严。` },
    { en: `Feedback channels let residents report issues within {num} hours.`, zh: `反馈渠道让居民可在{num}小时内反映问题。` },
    { en: `The approach cut average waiting time by about {pct}%.`, zh: `该做法使平均等候时间缩短约{pct}%。` },
    { en: `NGO partnerships widened the safety net for vulnerable groups.`, zh: `与公益组织的合作，扩大了弱势群体的保障网。` },
    { en: `Community centres became hubs for care, learning and socialising.`, zh: `社区中心成为照料、学习与交往的综合枢纽。` },
    { en: `A yearly review measured satisfaction and guided the next steps.`, zh: `年度评估量化了群众满意度，并据此明确下一步。` },
    { en: `Inclusive services aimed to leave no one behind in the transition.`, zh: `普惠服务致力于在转型中不让任何人掉队。` },
  ],
  world: [
    { en: `Delegates discussed shared challenges and exchanged practical experience.`, zh: `与会代表围绕共同挑战展开讨论，并交流务实经验。` },
    { en: `A joint statement pledged stronger coordination on cross-border issues.`, zh: `一份联合声明承诺就跨境议题加强协调。` },
    { en: `Observers noted cooperation yields benefits beyond any single nation.`, zh: `观察人士指出，合作带来的益处远超单一国家范畴。` },
    { en: `New funds will support development programmes in partner regions.`, zh: `新增资金将用于支持伙伴区域的发展项目。` },
    { en: `Experts welcomed the emphasis on science-based decision making.`, zh: `专家对坚持科学决策导向表示欢迎。` },
    { en: `Exchange programmes involved more than {num} thousand students.`, zh: `交流项目惠及超过{num}千名学生。` },
    { en: `Participants set a roadmap to review at the next summit in {year}.`, zh: `与会方制定了路线图，将在{year}下届峰会审议。` },
    { en: `Analysts said the outcome reflected a shared sense of urgency.`, zh: `分析人士称，成果折射出各方的共同紧迫感。` },
    { en: `Humanitarian aid reached about {pct}% of the planned beneficiaries.`, zh: `人道主义援助已覆盖计划受益者的约{pct}%。` },
    { en: `Follow-up meetings will track implementation across regions.`, zh: `后续会议将跟踪各区域的落实进展。` },
    { en: `Multilateral platforms gave smaller states a stronger voice.`, zh: `多边平台让中小国家拥有了更大的发言权。` },
    { en: `Shared standards reduced friction in trade and mobility.`, zh: `共同标准降低了贸易与人员往来的摩擦。` },
  ],
  education: [
    { en: `Vocational training linked curricula to real employer needs.`, zh: `职业培训将课程与用人单位实际需求相对接。` },
    { en: `Rural schooling gained teachers, devices and broadband access.`, zh: `乡村学校补上了师资、设备与宽带短板。` },
    { en: `Online learning widened access for learners in remote areas.`, zh: `在线学习让偏远地区学习者获得了更多机会。` },
    { en: `Teacher development focused on pedagogy and well-being.`, zh: `教师发展聚焦于教学法与身心关怀。` },
    { en: `Language education stressed use, not just examination scores.`, zh: `语言教育重在运用，而非仅看考试分数。` },
    { en: `Student well-being services expanded counselling and sport.`, zh: `学生心理健康服务拓展了咨询与体育锻炼。` },
    { en: `Schools reported a {pct}% rise in student participation this term.`, zh: `学校通报本学期学生参与度上升{pct}%。` },
    { en: `Free courses reached more than {num} thousand learners.`, zh: `免费课程覆盖了超过{num}千名学习者。` },
    { en: `Enterprise partnerships opened {num} thousand internships.`, zh: `校企合作提供了{num}千个实习岗位。` },
    { en: `Equity was stressed as the core principle of the reform.`, zh: `公平被确立为此次改革的核心原则。` },
    { en: `A scholarship fund will aid rural students by {year}.`, zh: `一项奖学金基金将在{year}前扶助乡村学子。` },
    { en: `Surveys showed rising satisfaction among families and teachers.`, zh: `调查显示，家庭与教师的满意度均有所上升。` },
  ],
  health: [
    { en: `Primary care brought basic services closer to neighbourhoods.`, zh: `基层医疗让基础服务更贴近社区。` },
    { en: `Disease prevention raised public awareness through campaigns.`, zh: `疾病预防通过科普宣传提高了公众意识。` },
    { en: `Mental-health support became easier to reach via hotlines and apps.`, zh: `借助热线与应用程序，心理健康支持更易获得。` },
    { en: `Healthy ageing services added day care and home visits.`, zh: `健康老龄化服务增添了日间照料与上门探访。` },
    { en: `Vaccination drives reached about {pct}% of the target group.`, zh: `疫苗接种覆盖了目标人群的约{pct}%。` },
    { en: `Community gyms opened free or low-cost to the elderly.`, zh: `社区健身房以免费或低偿方式向老年人开放。` },
    { en: `Clinics treated about {num} thousand more patients this year.`, zh: `诊所今年多接诊约{num}千名患者。` },
    { en: `Officials urged regular check-ups and balanced lifestyles.`, zh: `官员呼吁定期体检、保持饮食起居平衡。` },
    { en: `Data showed a steady drop in preventable hospitalisations.`, zh: `数据显示，可预防的住院人数稳步下降。` },
    { en: `The plan will extend to rural towns by the end of {year}.`, zh: `该计划将在{year}底前延伸至乡镇。` },
    { en: `Coordination between hospitals and communities was called essential.`, zh: `专家称医院与社区之间的协同至关重要。` },
    { en: `Telemedicine narrowed gaps for patients far from big hospitals.`, zh: `远程医疗缩小了偏远患者与大医院的差距。` },
  ],
  sports: [
    { en: `Youth training built skill and character through regular coaching.`, zh: `青少年训练通过系统 coaching 既练技术也塑品格。` },
    { en: `Mass fitness events drew record numbers of participants.`, zh: `群众健身活动参与的群众人数创下纪录。` },
    { en: `Marathon events attracted runners from {num} countries and regions.`, zh: `马拉松赛事吸引了来自{num}个国家和地区的跑者。` },
    { en: `Winter sports festivals spread interest beyond traditional areas.`, zh: `冰雪运动节让项目兴趣走出传统地区。` },
    { en: `School athletics added daily exercise and raised fitness by {pct}%.`, zh: `校园体育增加每日锻炼，学生体能提升约{pct}%。` },
    { en: `New facilities opened in {num} communities at low or no cost.`, zh: `{num}个社区以低偿或无偿方式开放了新设施。` },
    { en: `Para athletes inspired crowds with strong, determined performances.`, zh: `残疾运动员以顽强出色的表现鼓舞了现场观众。` },
    { en: `Officials pledged to keep public venues open to all.`, zh: `官员承诺保持公共体育场馆向所有人开放。` },
    { en: `Community clubs turned weekends into habits of active living.`, zh: `社区俱乐部把周末变成了积极生活的固定习惯。` },
    { en: `A winter-sports festival is planned before the end of {year}.`, zh: `冰雪运动节计划在{year}前举办。` },
    { en: `Grassroots leagues gave amateurs regular, organised competition.`, zh: `基层联赛让业余爱好者有了规律、有组织的比赛。` },
    { en: `Sports were used to bond communities and promote healthy ageing.`, zh: `体育被用于凝聚社区，并助推健康老龄化的实现。` },
  ],
}

// ---------------- 填充 ----------------
function fill(t, ctx) {
  return t.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] !== undefined ? ctx[k] : `{${k}}`))
}
function buildCtx(cat) {
  const city = pickPaired(CITY)
  const org = pickPaired(ORG)
  const month = pickPaired(MONTH)
  const name = pickPaired(NAME)
  const sector = pickPaired(SECTOR)
  const topic = pickPaired(cat.topics)
  const year = pick(YEARS)
  const pct = randInt(8, 96)
  const num = randInt(2, 9)
  const amount = randInt(1, 9)
  const day = String(randInt(1, 28)).padStart(2, '0')
  return {
    cityEn: city.en, cityZh: city.zh,
    orgEn: org.en, orgZh: org.zh,
    monthEn: month.en, monthZh: month.zh,
    nameEn: name.en, nameZh: name.zh,
    sectorEn: sector.en, sectorZh: sector.zh,
    topicEn: topic.en, topicZh: topic.zh,
    year, pct, num, amount, day,
  }
}
function datelineEn(ctx) {
  return `${ctx.cityEn.toUpperCase()}, ${ctx.monthEn} ${ctx.day} (People's Daily) — `
}
function datelineZh(ctx) {
  return `【${ctx.cityZh}，${ctx.monthZh}${ctx.day}日】 `
}

// ---------------- 段落构造 ----------------
// 每个段落由 1 句类目专属 + 3 句通用组成（4 句），保证左右逐段对应且篇幅充足。
function makeParagraph(catKey, ctx) {
  const specific = pick(CATEGORY_POOL[catKey])
  const g1 = pick(GENERIC)
  const g2 = pick(GENERIC)
  const g3 = pick(GENERIC)
  const en = `${fill(specific.en, ctx)} ${fill(g1.en, ctx)} ${fill(g2.en, ctx)} ${fill(g3.en, ctx)}`
  const zh = `${fill(specific.zh, ctx)}${fill(g1.zh, ctx)}${fill(g2.zh, ctx)}${fill(g3.zh, ctx)}`
  return { en, zh }
}

// ---------------- 主流程 ----------------
const PER_CATEGORY = Number(process.env.ART_PER_CATEGORY) || 10000 // 默认 10000；调试可用 ART_PER_CATEGORY=20
const MIN_ZH = 5000 // 每篇中文翻译下限
const MIN_PARAS = 40
const MAX_PARAS = 80
const START = Date.parse('2015-01-01')
const END = Date.parse('2026-07-19')

function makeArticle(catKey, idx) {
  const cat = CATEGORIES_META[catKey]
  const ctx = buildCtx(cat)
  const headline = pick(cat.headlines)
  const title_en = fill(headline.en, ctx)
  const title_zh = fill(headline.zh, ctx)
  const body_en = []
  const body_zh = []
  let n = 0
  while (n < MAX_PARAS) {
    const p = makeParagraph(catKey, ctx)
    if (n === 0) {
      p.en = datelineEn(ctx) + p.en
      p.zh = datelineZh(ctx) + p.zh
    }
    body_en.push(p.en)
    body_zh.push(p.zh)
    n++
    // 达到下限且不少于最小段数后停止
    const zhLen = body_zh.join('').length
    if (n >= MIN_PARAS && zhLen >= MIN_ZH) break
  }
  const published_at = new Date(START + Math.floor(Math.random() * (END - START)))
    .toISOString().slice(0, 10)
  return {
    id: `A-${catKey}-${String(idx).padStart(6, '0')}`,
    title_en, title_zh, body_en, body_zh,
    category: catKey, category_en: cat.nameEn, category_zh: cat.nameZh,
    source: 'people-daily-style',
    published_at,
  }
}

// 类目元信息（标题模板，复用原结构）
const CATEGORIES_META = {
  politics: { nameEn: 'Politics', nameZh: '时政', topics: [
    { en: 'rural revitalization', zh: '乡村振兴' }, { en: 'public service reform', zh: '公共服务改革' },
    { en: 'poverty alleviation', zh: '脱贫攻坚' }, { en: 'grassroots governance', zh: '基层治理' },
    { en: 'administrative streamlining', zh: '简政放权' }, { en: 'civil service training', zh: '干部队伍建设' },
  ], headlines: [
    { en: `{cityEn} advances {topicEn} with new measures`, zh: `{cityZh}推出新举措推进{topicZh}` },
    { en: `{orgEn} unveils plan to strengthen {topicEn}`, zh: `{orgZh}发布方案加强{topicZh}` },
    { en: `Steady progress reported in {topicEn} across {cityEn}`, zh: `{cityZh}在{topicZh}方面取得稳步进展` },
  ] },
  economy: { nameEn: 'Economy', nameZh: '经济', topics: [
    { en: 'high-tech manufacturing', zh: '高技术制造' }, { en: 'cross-border trade', zh: '跨境贸易' },
    { en: 'small business support', zh: '中小企业扶持' }, { en: 'consumer spending', zh: '消费增长' },
    { en: 'green finance', zh: '绿色金融' }, { en: 'digital economy', zh: '数字经济' },
  ], headlines: [
    { en: `{cityEn} reports {pct}% growth in {topicEn}`, zh: `{cityZh}{topicZh}增长{pct}%` },
    { en: `{topicEn} drives recovery in {cityEn}`, zh: `{topicZh}带动{cityZh}复苏` },
    { en: `Investment in {topicEn} rises across the region`, zh: `全区{topicZh}投资上升` },
  ] },
  culture: { nameEn: 'Culture', nameZh: '文化', topics: [
    { en: 'intangible heritage', zh: '非物质文化遗产' }, { en: 'public libraries', zh: '公共图书馆' },
    { en: 'traditional opera', zh: '传统戏曲' }, { en: 'creative industries', zh: '创意产业' },
    { en: 'museum exhibitions', zh: '博物馆展览' }, { en: 'reading campaigns', zh: '全民阅读' },
  ], headlines: [
    { en: `{cityEn} celebrates {topicEn} with autumn festival`, zh: `{cityZh}举办秋季活动庆祝{topicZh}` },
    { en: `New museum opens in {cityEn} showcasing {topicEn}`, zh: `{cityZh}新开博物馆展示{topicZh}` },
    { en: `{topicEn} draws record visitors in {cityEn}`, zh: `{topicZh}在{cityZh}吸引创纪录观众` },
  ] },
  technology: { nameEn: 'Technology', nameZh: '科技', topics: [
    { en: 'artificial intelligence', zh: '人工智能' }, { en: 'renewable energy', zh: '可再生能源' },
    { en: 'smart manufacturing', zh: '智能制造' }, { en: 'space exploration', zh: '太空探索' },
    { en: 'biomedical research', zh: '生物医学研究' }, { en: 'cloud computing', zh: '云计算' },
  ], headlines: [
    { en: `{cityEn} launches hub for {topicEn}`, zh: `{cityZh}启动{topicZh}中心` },
    { en: `Breakthrough in {topicEn} reported by {cityEn} lab`, zh: `{cityZh}实验室报告{topicZh}突破` },
    { en: `{topicEn} adoption accelerates in {cityEn}`, zh: `{topicZh}在{cityZh}加速普及` },
  ] },
  environment: { nameEn: 'Environment', nameZh: '环境', topics: [
    { en: 'afforestation', zh: '植树造林' }, { en: 'air quality control', zh: '空气质量治理' },
    { en: 'wetland protection', zh: '湿地保护' }, { en: 'waste sorting', zh: '垃圾分类' },
    { en: 'river restoration', zh: '河流修复' }, { en: 'low-carbon cities', zh: '低碳城市' },
  ], headlines: [
    { en: `{cityEn} expands {topicEn} to meet green goals`, zh: `{cityZh}扩大{topicZh}以实现绿色目标` },
    { en: `Air quality improves in {cityEn} after {topicEn}`, zh: `{cityZh}实施{topicZh}后空气质量改善` },
    { en: `{num} thousand trees planted in {cityEn}`, zh: `{cityZh}植树{num}千棵` },
  ] },
  society: { nameEn: 'Society', nameZh: '社会', topics: [
    { en: 'elderly care', zh: '养老照护' }, { en: 'community services', zh: '社区服务' },
    { en: 'employment support', zh: '就业帮扶' }, { en: 'disability inclusion', zh: '残障融合' },
    { en: 'volunteerism', zh: '志愿服务' }, { en: 'food safety', zh: '食品安全' },
  ], headlines: [
    { en: `{cityEn} improves {topicEn} for residents`, zh: `{cityZh}改善居民{topicZh}` },
    { en: `New programme boosts {topicEn} in {cityEn}`, zh: `新项目提升{cityZh}的{topicZh}` },
    { en: `Over {num} thousand households benefit from {topicEn}`, zh: `超过{num}千户家庭受益于{topicZh}` },
  ] },
  world: { nameEn: 'World', nameZh: '国际', topics: [
    { en: 'global climate action', zh: '全球气候行动' }, { en: 'trade cooperation', zh: '贸易合作' },
    { en: 'public health', zh: '公共卫生' }, { en: 'scientific collaboration', zh: '科学合作' },
    { en: 'cultural exchange', zh: '文化交流' }, { en: 'peacekeeping efforts', zh: '维和努力' },
  ], headlines: [
    { en: `Nations advance {topicEn} at forum`, zh: `各国在论坛推动{topicZh}` },
    { en: `{topicEn} highlighted in joint statement`, zh: `联合声明强调{topicZh}` },
    { en: `Parties agree to deepen {topicEn}`, zh: `各方同意深化{topicZh}` },
  ] },
  education: { nameEn: 'Education', nameZh: '教育', topics: [
    { en: 'vocational training', zh: '职业培训' }, { en: 'rural schooling', zh: '乡村教育' },
    { en: 'online learning', zh: '在线学习' }, { en: 'teacher development', zh: '教师发展' },
    { en: 'language education', zh: '语言教育' }, { en: 'student well-being', zh: '学生心理健康' },
  ], headlines: [
    { en: `{cityEn} strengthens {topicEn} for all`, zh: `{cityZh}加强全民{topicZh}` },
    { en: `Reform lifts {topicEn} in {cityEn}`, zh: `改革提升{cityZh}的{topicZh}` },
    { en: `{num} thousand students gain from {topicEn}`, zh: `{num}千名学生受益于{topicZh}` },
  ] },
  health: { nameEn: 'Health', nameZh: '健康', topics: [
    { en: 'primary care', zh: '基层医疗' }, { en: 'disease prevention', zh: '疾病预防' },
    { en: 'mental health', zh: '心理健康' }, { en: 'healthy aging', zh: '健康老龄化' },
    { en: 'vaccination drives', zh: '疫苗接种' }, { en: 'sports for all', zh: '全民健身' },
  ], headlines: [
    { en: `{cityEn} expands {topicEn} coverage`, zh: `{cityZh}扩大{topicZh}覆盖` },
    { en: `Campaign promotes {topicEn} in {cityEn}`, zh: `{cityZh}开展{topicZh}宣传` },
    { en: `{pct}% of residents served by {topicEn}`, zh: `{pct}%居民享有{topicZh}` },
  ] },
  sports: { nameEn: 'Sports', nameZh: '体育', topics: [
    { en: 'youth training', zh: '青少年训练' }, { en: 'mass fitness', zh: '群众体育' },
    { en: 'marathon events', zh: '马拉松赛事' }, { en: 'winter sports', zh: '冰雪运动' },
    { en: 'school athletics', zh: '校园体育' }, { en: 'para sports', zh: '残疾人体育' },
  ], headlines: [
    { en: `{cityEn} hosts event to boost {topicEn}`, zh: `{cityZh}举办活动推动{topicZh}` },
    { en: `Record turnout for {topicEn} in {cityEn}`, zh: `{cityZh}{topicZh}参与创纪录` },
    { en: `{num} thousand join {topicEn} programme`, zh: `{num}千人参加{topicZh}项目` },
  ] },
}

let grand = 0
for (const catKey of Object.keys(CATEGORIES_META)) {
  const arr = []
  let minZh = Infinity
  for (let i = 0; i < PER_CATEGORY; i++) {
    const a = makeArticle(catKey, i)
    const zhLen = a.body_zh.join('').length
    if (zhLen < minZh) minZh = zhLen
    arr.push(a)
  }
  writeFileSync(join(outDir, `${catKey}.json`), JSON.stringify(arr))
  console.log(`[articles] ${catKey}: ${arr.length} 篇, 最小中文字数=${minZh}`)
  grand += arr.length
}
console.log(`TOTAL articles generated: ${grand}`)
