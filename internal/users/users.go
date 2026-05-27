package users

import (
	"fmt"
)

type User struct {
	Username string
//	Stream string
//	Parts int
//	PartsWon int
//	PartsLost int
//	PartsSpent int
//	GameData []GameData
}

type manager struct {
	users map[string]*User
}

func NewManager() *manager {
    return &manager{users: make(map[string]*User)}
}

func (u *User) UpdateUser() {}

func (m *manager) GetUser(username string) *User {
	if(m.users[username] != nil) {
		fmt.Println("found user")
		return m.users[username]
	} else {
		fmt.Println("creating user")
		m.users[username] = &User{Username: username}
		return m.users[username]
	}

}

//func New() *User {

//}
// var defaultUser = {
//   username: '',
//   stream: '',
//   parts: 0,
//   partsWon: 0,
//   partsLost: 0,
//   partsSpent: 0,
//   gameData: {}
// };