const ldap = require('ldapjs');
const express = require('express');

const authenticateUser = (username, password, domain = 'cement.cementhai.com') => {
    return new Promise((resolve, reject) => {
        const client = ldap.createClient({
            url: `ldap://${domain}`
        });

        client.on('error', (err) => {
            console.error('LDAP client error:', err);
            // Optionally, handle reconnection or alert admins, etc.
        });

        client.bind(username, password, (err) => {
            if (err) {
                console.error('Error binding to LDAP server:', err);
                resolve(false);
                client.unbind();
                return;
            }

            const opts = {
                filter: '(objectClass=*)',
                scope: 'sub',
                attributes: ['cn']
            };

            client.search(`dc=${domain.replace(/\./g, ',dc=')}`, opts, (err, res) => {
                if (err) {
                    console.error('Error searching LDAP:', err);
                    resolve(false);
                    return;
                }

                let userFound = false;

                res.on('searchEntry', (entry) => {
                    console.log('Entry:', entry.object);
                    userFound = true;
                });

                res.on('end', (result) => {
                    client.unbind();
                    resolve(userFound);
                });

                res.on('error', (err) => {
                    console.error('Search error:', err);
                    client.unbind();
                    resolve(false);
                });
            });
        });
    });
};

const router = express.Router();

router.post('/', async (req, res, next) => {
    const { username, password, domain } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Ensure domain is valid, default to 'cement.cementhai.com' if not provided
    const validDomain = domain && domain.trim() !== '' ? domain : 'cement.cementhai.com';

    try {
        const authenticated = await authenticateUser(username, password, validDomain);
        if (authenticated) {
            res.status(200).json({ message: 'User authenticated successfully' });
        } else {
            res.status(401).json({ error: 'Authentication failed' });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
