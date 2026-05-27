package blackjack

import (
	"botparts/internal/routing"
	"botparts/internal/users"
	"regexp"
)

func GetRoutes(u users.Manager) []routing.Route {
	return []routing.Route {
		routing.Route {
			Pattern: regexp.MustCompile(`(?i)^\!(?:blackjack|bj)\b\W*double`),
			Handler: u.WithUser(test),
		},
		routing.Route {
			Pattern: regexp.MustCompile(`(?i)^\!(?:blackjack|bj)\b\W*hit`),
			Handler: handleHit,
		},
		routing.Route {
			Pattern: regexp.MustCompile(`(?i)^\!(?:blackjack|bj)\b\W*split`),
			Handler: handleSplit,
		},
		routing.Route {
			Pattern: regexp.MustCompile(`(?i)^\!(?:blackjack|bj)\b\W*stay`),
			Handler: handleStay,
		},
		routing.Route {
			Pattern: regexp.MustCompile(`(?i)^\!(?:blackjack|bj)\b\W*status`),
			Handler: handleStatus,
		},	
		routing.Route {
			Pattern: regexp.MustCompile(`(?i)^\!(?:blackjack|bj)\b\W*$`),
			Handler: handleStatus,
		},
		routing.Route {
			Pattern: regexp.MustCompile(`(?i)^\!(?:blackjack|bj)\b\W*\w+`),
			Handler: handleDefault,
		},
	}
} 