import styled from 'styled-components'

import { $contextColor, $contextColorDark, $contextColorLight, $contextMenuRound } from './vars'

export const CommonStyle = styled.div`
  color: #fff;
  padding: 4px;
  border-bottom: 1px solid ${$contextColorDark};
  background-color: ${$contextColor};
  cursor: pointer;
  width: 100%;
  position: relative;
  &:first-child {
    border-top-left-radius: ${$contextMenuRound};
    border-top-right-radius: ${$contextMenuRound};
  }
  &:last-child {
    border-bottom-left-radius: ${$contextMenuRound};
    border-bottom-right-radius: ${$contextMenuRound};
  }
  &:hover {
    background-color: ${$contextColorLight};
  }
`
