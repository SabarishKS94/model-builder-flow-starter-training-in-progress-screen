export const CHAT_HISTORY_SEARCH_CONVERSATIONS = [
    {
        id: 'search-sf-1',
        title: 'Connecting Agentforce to Salesforce Service',
        snippet:
            '…you can connect Agentforce to Salesforce Service Cloud by enabling the case object API and mapping it to your agent workflow…',
        agent: 'Agentforce Agent',
        date: 'Today',
    },
    {
        id: 'search-sf-2',
        title: 'Trailhead Modules for Learning Automation',
        snippet:
            "…if you're starting with Salesforce automation, I recommend the Flow Builder and Process Automation Trailhead modules first…",
        agent: 'Trailhead Agent',
        date: 'Yesterday',
    },
    {
        id: 'search-sf-3',
        title: 'Improving Opportunity Discovery Calls',
        snippet:
            '…when reviewing deals inside Salesforce, look for stalled opportunities and ask discovery questions tied to budget and timeline…',
        agent: 'Sales Coach Agent',
        date: 'Jan 23',
    },
    {
        id: 'search-sf-4',
        title: 'Troubleshooting a Salesforce Flow Error',
        snippet:
            '…a common reason a Flow fails during testing is missing field permissions or an unhandled decision branch…',
        agent: 'Trailhead Agent',
        date: 'Dec 6, 2025',
    },
    {
        id: 'search-sf-5',
        title: 'Building Reports for Quarterly Sales Reviews',
        snippet:
            '…you can build a Salesforce dashboard showing pipeline coverage, win rate, and average sales cycle using opportunity reports…',
        agent: 'Sales Coach Agent',
        date: 'Nov 8, 2025',
    },
    {
        id: 'search-sf-6',
        title: 'Building Reports for Quarterly Sales Reviews',
        snippet:
            '…you can build a Salesforce dashboard showing pipeline coverage, win rate, and average sales cycle using opportunity reports…',
        agent: 'Salesforce Help',
        agentDisplay: [
            { text: 'Salesforce', bold: true },
            { text: ' Help', bold: false },
        ],
        date: 'Oct 30, 2025',
    },
];

export const CHAT_HISTORY_SECTIONS = [
    {
        id: 'today',
        label: 'Today',
        chats: [
            {
                id: 'handling-objections',
                firstUserMessage: 'Where can I find the PDF for the 2026 medical benefits summary?',
                agent: 'Employee Agent',
                isResumable: true,
            },
        ],
    },
    {
        id: 'yesterday',
        label: 'Yesterday',
        chats: [
            {
                id: 'google-doc-summary',
                firstUserMessage: "I'm locked out of the mobile CRM while traveling",
                agent: 'Employee Agent',
                isResumable: true,
            },
            {
                id: 'automating-case-routing',
                firstUserMessage: 'We need an enterprise demo for 200 users next week',
                agent: 'Sales Agent',
                isResumable: true,
            },
        ],
    },
    {
        id: 'past-week',
        label: 'Last Week',
        chats: [
            {
                id: 'trailhead-beginners',
                firstUserMessage: 'My commission payout for the Acme deal seems incorrect',
                agent: 'Sales Agent',
                isResumable: false,
            },
            {
                id: 'designing-workflow',
                firstUserMessage: 'What is the daily mileage reimbursement rate?',
                agent: 'Employee Agent',
                isResumable: false,
            },
            {
                id: 'benefits-hr',
                firstUserMessage: 'I need to log a joint pursuit with our AWS partner',
                agent: 'Sales Agent',
                isResumable: false,
            },
        ],
    },
    {
        id: 'may',
        label: 'May',
        chats: [
            {
                id: 'improving-discovery',
                firstUserMessage: 'Does our SI partner get a 10% or 15% referral fee?',
                agent: 'Sales Agent',
                isResumable: false,
            },
            {
                id: 'recommended-trailhead',
                firstUserMessage: 'Can you recommend a Trailhead Path for me?',
                agent: 'Learning Agent',
                isResumable: false,
            },
            {
                id: 'connecting-service',
                firstUserMessage: 'Why is my Zoom Info credit allocation short this month?',
                agent: 'Sales Agent',
                isResumable: false,
            },
            {
                id: 'debugging-flow',
                firstUserMessage: 'Can we get a standard NDA signed before the call?',
                agent: 'Deal Desk Agent',
                isResumable: false,
            },
            {
                id: 'closing-deals',
                firstUserMessage: 'I need a quick read on deal momentum before quarter close.',
                agent: 'Sales Coach Agent',
                isResumable: false,
            },
            {
                id: 'deployment-practices',
                firstUserMessage: 'The Q1 commission tier adjustment has not been applied to my account',
                agent: 'Sales Agent',
                isResumable: false,
            },
        ],
    },
];

export function getChatById(chatId) {
    for (const section of CHAT_HISTORY_SECTIONS) {
        const found = section.chats.find((c) => c.id === chatId);
        if (found) {
            return { ...found };
        }
    }
    return null;
}
