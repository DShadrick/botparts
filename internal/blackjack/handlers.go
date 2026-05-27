package blackjack

import (
	"fmt"
	"botparts/internal/users"
	"github.com/gempir/go-twitch-irc/v4"
)

func test(m twitch.PrivateMessage, u *users.User) {
	fmt.Println(m.Message, u.Username)
}

func handleDefault(message twitch.PrivateMessage) {
	//take bet or return game state message
	fmt.Println("unknown blackjack command:", message.Message)
}

func handleDouble(message twitch.PrivateMessage) {
	//double the bet, add hit once and stay or return game state message
	fmt.Println("double")
}

func handleHit(message twitch.PrivateMessage) {
	//give card or return game state message
	fmt.Println("hit")
}

func handleSplit(message twitch.PrivateMessage) {
	//create second hand, collect additional bet, continue both hands or return game state
	fmt.Println("split")
}

func handleStay(message twitch.PrivateMessage) {
	//finish finish game and show result, or give game state
	fmt.Println("stay")
}

func handleStats(message twitch.PrivateMessage) {
	//tell the player about their history of wins and losses
	fmt.Println("stats")
}

func handleStatus(message twitch.PrivateMessage) {
	//tell the player the status of thier hand
	fmt.Println("status")
}

