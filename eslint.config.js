import neostandard from 'neostandard';

const neoConfig = neostandard({
    ts: true,
    noStyle: true
});

export default [
    ...neoConfig,
    {
        rules: {
            'no-console': 'warn'
        }
    }
];
