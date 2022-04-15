CREATE TABLE schedules (
    id          serial      PRIMARY KEY,
    user_id     INT         NOT NULL,
    day         INT         NOT NULL,
    start_at    TIME        NOT NULL,
    end_at      TIME        NOT NULL
);

CREATE TABLE users (
    id          serial      PRIMARY KEY,
    lastname    VARCHAR     NOT NULL,
    firstname   VARCHAR     NOT NULL,
    email       VARCHAR     NOT NULL,
    password    VARCHAR     NOT NULL
);

SELECT user_id, day, start_at, end_at, firstname, lastname FROM schedules LEFT JOIN users ON (user_id=users.id) ORDER BY day;
