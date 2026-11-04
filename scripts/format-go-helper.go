package main

import (
 "encoding/json"
 "fmt"
 "go/format"
 "go/scanner"
 "go/token"
 "io"
 "os"
 "strings"
)

type Source struct { ID int `json:"id"`; Code string `json:"code"` }
type Result struct { Code string `json:"code"`; LineMap map[int][]int `json:"lineMap"` }
type Lexeme struct { Key string; Line int }
func lex(code string) []Lexeme {
 fset:=token.NewFileSet();file:=fset.AddFile("solution.go",-1,len(code));var s scanner.Scanner
 s.Init(file,[]byte(code),nil,0);out:=[]Lexeme{}
 for {pos,tok,lit:=s.Scan();if tok==token.EOF {break};if tok==token.SEMICOLON {continue};out=append(out,Lexeme{tok.String()+":"+lit,fset.Position(pos).Line})}
 return out
}
func mapping(a,b []Lexeme) map[int][]int {
 out:=map[int][]int{}
 add:=func(i,j int){r:=out[a[i].Line];for _,v:=range r {if v==b[j].Line{return}};out[a[i].Line]=append(r,b[j].Line)}
 same:=len(a)==len(b);if same {for i:=range a {if a[i].Key!=b[i].Key{same=false;break}}};if same{for i:=range a{add(i,i)};return out}
 // Import sorting can move a few lexical tokens. Align the unchanged program via LCS.
 m:=len(b)+1;dp:=make([]uint16,(len(a)+1)*m)
 for i:=len(a)-1;i>=0;i--{for j:=len(b)-1;j>=0;j--{if a[i].Key==b[j].Key{dp[i*m+j]=dp[(i+1)*m+j+1]+1}else if dp[(i+1)*m+j]>=dp[i*m+j+1]{dp[i*m+j]=dp[(i+1)*m+j]}else{dp[i*m+j]=dp[i*m+j+1]}}}
 for i,j:=0,0;i<len(a)&&j<len(b);{if a[i].Key==b[j].Key{add(i,j);i++;j++}else if dp[(i+1)*m+j]>=dp[i*m+j+1]{i++}else{j++}}
 return out
}
func main(){
 raw,err:=io.ReadAll(os.Stdin);if err!=nil{panic(err)};var sources []Source;if err=json.Unmarshal(raw,&sources);err!=nil{panic(err)}
 results:=map[int]Result{}
 for _,s:=range sources{
  code:=strings.TrimSpace(s.Code);full:="package lesson\n\n"+code+"\n";formatted,err:=format.Source([]byte(full));if err!=nil{fmt.Fprintf(os.Stderr,"problem %d: %v\n",s.ID,err);os.Exit(1)}
  rendered:=strings.TrimSpace(strings.TrimPrefix(string(formatted),"package lesson\n\n"))
  results[s.ID]=Result{rendered,mapping(lex(code),lex(rendered))}
 }
 if err=json.NewEncoder(os.Stdout).Encode(results);err!=nil{panic(err)}
}
