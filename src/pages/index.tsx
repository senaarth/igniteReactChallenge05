import { GetStaticProps } from 'next';
import React, { useState } from 'react';
import Head from "next/head";
import Link from "next/link";

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiUser, FiCalendar } from 'react-icons/fi';

import Header from "../components/Header";
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const formattedPosts = postsPagination.results.map((post) => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    }
  });

  const [posts, setPosts] = useState(formattedPosts);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleLoadMorePosts() {
    if (!nextPage) {
      return;
    }

    const postsResults = await fetch(`${nextPage}`).then((res) => res.json());

    setNextPage(postsResults.next_page);
    setCurrentPage(postsResults.page);

    const newPosts = postsResults.results.map((post) => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([
      ...posts,
      ...newPosts
    ]);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <div className={commonStyles.mainContainer}>
        <Header />
        <div className={styles.postsContainer}>
          {
            posts.map((post) => (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a
                  className={styles.postContainer}
                >
                  <h1 className={commonStyles.title}>{post.data.title}</h1>
                  <p className={commonStyles.subtitle}>{post.data.subtitle}</p>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '35%',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <FiCalendar size={15} color="#BBB" />
                      <p className={commonStyles.infoText}>
                        {post.first_publication_date}
                      </p>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <FiUser size={15} color="#BBB" />
                      <p className={commonStyles.infoText}>
                        {post.data.author}
                      </p>
                    </div>
                  </div>
                </a>
              </Link>
            ))
          }
          {
            nextPage && (
              <p
                className={commonStyles.loadMore}
                onClick={() => handleLoadMorePosts()}
              >
                Carregar mais posts
              </p>
            )
          }
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const posts = postsResponse.results.map((post) => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  }

  return {
    props: {
      postsPagination,
      revalidate: 1800,
    }
  }
};
